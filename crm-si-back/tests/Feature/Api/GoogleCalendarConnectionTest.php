<?php

namespace Tests\Feature\Api;

use App\Jobs\SyncTaskCalendarEventJob;
use App\Models\GoogleCalendarConnection;
use App\Models\Task;
use App\Models\TaskCalendarSync;
use App\Models\Tenant;
use App\Models\User;
use App\Support\GoogleCalendarClient;
use App\Support\GoogleCalendarOAuth;
use App\Support\PermissionCatalog;
use App\Support\RoleProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class GoogleCalendarConnectionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.google_calendar.client_id', 'test-client-id');
        config()->set('services.google_calendar.client_secret', 'test-client-secret');
        config()->set('services.google_calendar.redirect_uri', 'http://localhost/api/google-calendar/callback');
    }

    public function test_authorization_url_returns_google_url_with_state(): void
    {
        [, $user] = $this->createTenantAndUser();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/google-calendar/authorization-url');

        $response->assertOk();
        $this->assertStringContainsString('accounts.google.com', $response->json('url'));
        $this->assertStringContainsString('state=', $response->json('url'));
        $this->assertStringContainsString('include_granted_scopes=true', $response->json('url'));
        $this->assertStringContainsString(
            urlencode('https://www.googleapis.com/auth/calendar.events.owned'),
            $response->json('url'),
        );
    }

    public function test_reauthorization_requests_only_calendar_scope_when_it_is_missing(): void
    {
        [$tenant, $user] = $this->createTenantAndUser();
        GoogleCalendarConnection::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'google_email' => 'a@example.com',
            'access_token' => 'x',
            'refresh_token' => 'y',
            'scopes' => ['openid', 'https://www.googleapis.com/auth/userinfo.email'],
            'status' => 'needs_reauth',
        ]);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/google-calendar/authorization-url');

        $response->assertOk();
        parse_str(parse_url($response->json('url'), PHP_URL_QUERY), $query);
        $this->assertSame(GoogleCalendarClient::CALENDAR_SCOPE, $query['scope']);
    }

    public function test_state_is_single_use_and_scoped_to_user_and_tenant(): void
    {
        [$tenant, $user] = $this->createTenantAndUser();

        $state = GoogleCalendarOAuth::createState($user);

        $first = GoogleCalendarOAuth::consumeState($state);
        $this->assertNotNull($first);
        $this->assertSame($user->id, $first['user_id']);
        $this->assertSame($tenant->id, $first['tenant_id']);
        $this->assertSame('combined', $first['phase']);

        $second = GoogleCalendarOAuth::consumeState($state);
        $this->assertNull($second, 'El state reusado debe rechazarse');
    }

    public function test_state_expires(): void
    {
        [, $user] = $this->createTenantAndUser();

        $state = GoogleCalendarOAuth::createState($user);

        // Simula expiración limpiando la cache directamente (el TTL real es 10 min).
        Cache::forget("google_calendar_oauth_state:{$state}");

        $this->assertNull(GoogleCalendarOAuth::consumeState($state));
    }

    public function test_callback_without_state_or_code_redirects_to_error(): void
    {
        $response = $this->get('/api/google-calendar/callback');

        $response->assertRedirect();
        $this->assertStringContainsString('google_calendar=error', $response->headers->get('Location'));
    }

    public function test_callback_with_invalid_state_redirects_to_expired(): void
    {
        $response = $this->get('/api/google-calendar/callback?state=bogus&code=CODE');

        $response->assertRedirect();
        $this->assertStringContainsString('google_calendar=expired', $response->headers->get('Location'));
    }

    public function test_connection_is_isolated_per_user_and_tenant(): void
    {
        [$tenantA, $userA] = $this->createTenantAndUser();
        [, $userB] = $this->createTenantAndUser();

        GoogleCalendarConnection::create([
            'tenant_id' => $tenantA->id,
            'user_id' => $userA->id,
            'google_email' => 'a@example.com',
            'access_token' => 'x',
            'refresh_token' => 'y',
            'scopes' => GoogleCalendarClient::SCOPES,
            'status' => 'connected',
        ]);

        Sanctum::actingAs($userA);
        $this->getJson('/api/google-calendar/connection')
            ->assertOk()
            ->assertJsonPath('data.google_email', 'a@example.com');

        Sanctum::actingAs($userB);
        $this->getJson('/api/google-calendar/connection')
            ->assertOk()
            ->assertJsonPath('data', null);
    }

    public function test_connection_without_calendar_scope_requires_reauth(): void
    {
        [$tenant, $user] = $this->createTenantAndUser();

        $connection = GoogleCalendarConnection::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'google_email' => 'a@example.com',
            'access_token' => 'x',
            'refresh_token' => 'y',
            'scopes' => ['openid', 'https://www.googleapis.com/auth/userinfo.email'],
            'status' => 'connected',
        ]);

        Sanctum::actingAs($user);
        $this->getJson('/api/google-calendar/connection')
            ->assertOk()
            ->assertJsonPath('data.status', 'needs_reauth');

        $this->assertSame('needs_reauth', $connection->fresh()->status);
    }

    public function test_reconnecting_dispatches_pending_meeting_syncs(): void
    {
        Queue::fake();
        [$tenant, $user] = $this->createTenantAndUser();

        $task = Task::create([
            'tenant_id' => $tenant->id,
            'name' => 'Reunión pendiente',
            'type' => 'reunion',
            'assigned_to' => $user->id,
            'starts_at' => now()->addDay(),
            'ends_at' => now()->addDay()->addMinutes(30),
            'meeting_timezone' => 'America/Argentina/Buenos_Aires',
        ]);

        TaskCalendarSync::create([
            'tenant_id' => $tenant->id,
            'task_id' => $task->id,
            'owner_user_id' => $user->id,
            'google_calendar_id' => 'primary',
            'external_event_id' => 'pendingevent123',
            'status' => 'pending',
        ]);

        GoogleCalendarOAuth::upsertConnection($user, [
            'access_token' => 'access-token',
            'refresh_token' => 'refresh-token',
            'expires_in' => 3600,
            'scope' => implode(' ', GoogleCalendarClient::SCOPES),
        ], 'a@example.com');

        Queue::assertPushed(
            SyncTaskCalendarEventJob::class,
            fn (SyncTaskCalendarEventJob $job): bool => $job->taskId === $task->id && $job->action === 'upsert',
        );
    }

    public function test_connection_without_calendar_scope_stays_pending_and_does_not_dispatch_syncs(): void
    {
        Queue::fake();
        [$tenant, $user] = $this->createTenantAndUser();
        $task = Task::create([
            'tenant_id' => $tenant->id,
            'name' => 'Reunión pendiente',
            'type' => 'reunion',
            'assigned_to' => $user->id,
            'starts_at' => now()->addDay(),
            'ends_at' => now()->addDay()->addMinutes(30),
            'meeting_timezone' => 'America/Argentina/Buenos_Aires',
        ]);

        $connection = GoogleCalendarOAuth::upsertConnection($user, [
            'access_token' => 'access-token',
            'refresh_token' => 'refresh-token',
            'expires_in' => 3600,
            'scope' => 'openid https://www.googleapis.com/auth/userinfo.email',
        ], 'a@example.com');

        $this->assertSame('needs_reauth', $connection->status);
        Queue::assertNotPushed(
            SyncTaskCalendarEventJob::class,
            fn (SyncTaskCalendarEventJob $job): bool => $job->taskId === $task->id,
        );
    }

    public function test_disconnect_removes_connection(): void
    {
        [$tenant, $user] = $this->createTenantAndUser();

        GoogleCalendarConnection::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'google_email' => 'a@example.com',
            'access_token' => 'x',
            'refresh_token' => 'y',
            'status' => 'connected',
        ]);

        Sanctum::actingAs($user);
        $this->deleteJson('/api/google-calendar/connection')->assertOk();

        $this->assertSame(0, GoogleCalendarConnection::where('tenant_id', $tenant->id)->count());
    }

    /**
     * @return array{0: Tenant, 1: User}
     */
    private function createTenantAndUser(): array
    {
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId(null);
        foreach (PermissionCatalog::all() as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
        $registrar->forgetCachedPermissions();

        $tenant = Tenant::create(['name' => 'Acme '.uniqid()]);
        app(RoleProvisioner::class)->provisionDefaultRoles($tenant);
        $registrar->setPermissionsTeamId($tenant->id);

        $user = User::factory()->create(['tenant_id' => $tenant->id]);
        $user->assignRole('Owner');

        return [$tenant, $user];
    }
}
