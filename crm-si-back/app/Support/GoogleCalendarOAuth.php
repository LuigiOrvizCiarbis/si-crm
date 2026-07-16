<?php

namespace App\Support;

use App\Jobs\SyncTaskCalendarEventJob;
use App\Models\GoogleCalendarConnection;
use App\Models\Scopes\TenantScope;
use App\Models\Task;
use App\Models\TaskCalendarSync;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * State de un solo uso para el flujo OAuth de Google Calendar. Se cachea
 * user_id+tenant_id contra un token random; el callback lo consume una sola
 * vez (Cache::pull) para evitar reuso o CSRF, y expira a los 10 minutos.
 */
class GoogleCalendarOAuth
{
    private const TTL_SECONDS = 600;

    public static function createState(User $user, string $phase = 'combined'): string
    {
        $state = Str::random(40);

        Cache::put(self::cacheKey($state), [
            'user_id' => $user->id,
            'tenant_id' => $user->tenant_id,
            'phase' => $phase,
        ], self::TTL_SECONDS);

        return $state;
    }

    /**
     * Consume el state (una sola vez). Devuelve el payload o null si es
     * inválido, ya usado, o expirado.
     */
    public static function consumeState(string $state): ?array
    {
        return Cache::pull(self::cacheKey($state));
    }

    public static function upsertConnection(User $user, array $googleToken, string $googleEmail): GoogleCalendarConnection
    {
        $connection = GoogleCalendarConnection::withoutGlobalScope(TenantScope::class)
            ->firstOrNew([
                'tenant_id' => $user->tenant_id,
                'user_id' => $user->id,
            ]);

        $connection->google_email = $googleEmail;
        $connection->setEncryptedAccessToken($googleToken['access_token']);

        if (! empty($googleToken['refresh_token'])) {
            $connection->setEncryptedRefreshToken($googleToken['refresh_token']);
        } elseif (! $connection->exists || ! $connection->refresh_token) {
            throw new \RuntimeException('Google no devolvió refresh_token (falta access_type=offline o prompt=consent).');
        }

        $connection->token_expires_at = now()->addSeconds($googleToken['expires_in'] ?? 3600);
        $connection->scopes = explode(' ', $googleToken['scope'] ?? '');
        $connection->status = in_array(GoogleCalendarClient::CALENDAR_SCOPE, $connection->scopes, true)
            ? 'connected'
            : 'needs_reauth';
        $connection->save();

        if ($connection->status === 'connected') {
            self::dispatchPendingMeetingSyncs($user);
        }

        return $connection;
    }

    private static function dispatchPendingMeetingSyncs(User $user): void
    {
        $taskIds = Task::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $user->tenant_id)
            ->where('assigned_to', $user->id)
            ->where('type', 'reunion')
            ->where('status', '!=', 'cancelado')
            ->pluck('id');

        if ($taskIds->isEmpty()) {
            return;
        }

        $syncs = TaskCalendarSync::withoutGlobalScope(TenantScope::class)
            ->whereIn('task_id', $taskIds)
            ->get(['task_id', 'status']);

        $existingTaskIds = $syncs->pluck('task_id');
        $pendingTaskIds = $syncs
            ->whereIn('status', ['pending', 'error'])
            ->pluck('task_id');

        $taskIds
            ->diff($existingTaskIds)
            ->merge($pendingTaskIds)
            ->unique()
            ->each(fn (int $taskId) => SyncTaskCalendarEventJob::dispatch($taskId, 'upsert'));
    }

    private static function cacheKey(string $state): string
    {
        return "google_calendar_oauth_state:{$state}";
    }
}
