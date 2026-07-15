<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Log de una recepción de webhook entrante. Sirve de DX de debug para el cliente
 * (vista en la UI). Se purga por antigüedad vía model:prune (MassPrunable).
 *
 * @property int $id
 * @property int $tenant_id
 * @property int $webhook_endpoint_id
 * @property string $status
 * @property ?int $http_status
 * @property ?array<string, mixed> $payload
 * @property ?array<string, mixed> $result
 * @property ?string $error
 * @property ?string $ip
 */
class WebhookDelivery extends Model
{
    use BelongsToTenant;
    use MassPrunable;

    protected $table = 'webhook_deliveries';

    protected $fillable = [
        'tenant_id',
        'webhook_endpoint_id',
        'status',
        'http_status',
        'payload',
        'result',
        'error',
        'ip',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'result' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function endpoint(): BelongsTo
    {
        return $this->belongsTo(WebhookEndpoint::class, 'webhook_endpoint_id');
    }

    /**
     * Deliveries más viejos que la retención configurada son elegibles para purga.
     */
    public function prunable(): Builder
    {
        $days = (int) config('webhooks.delivery_retention_days', 30);

        return static::query()->where('created_at', '<', now()->subDays($days));
    }
}
