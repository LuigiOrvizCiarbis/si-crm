<?php

namespace App\Jobs;

use App\Models\WebhookDelivery;
use App\Models\WebhookEndpoint;
use App\Services\WebhookContactUpsertService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * Procesa en cola un batch bulk de contactos recibido por webhook entrante.
 * El payload completo vive en webhook_deliveries (status 'queued'); el job lo
 * lee, hace el upsert y deja el resultado en el mismo delivery, que el cliente
 * puede consultar por GET .../deliveries/{id}.
 *
 * - tries=3: reintentar es seguro — el upsert es idempotente por
 *   (tenant_id, source, external_id), re-procesar no duplica contactos.
 * - timeout=300: batches de hasta bulk_max_contacts con N+1 por contacto.
 *   REDIS_QUEUE_RETRY_AFTER debe ser mayor para evitar ejecución doble
 *   concurrente (tolerable por idempotencia, pero desperdicia workers).
 */
class ProcessWebhookBulkImportJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 300;

    public function __construct(
        public int $deliveryId,
        public int $tenantId,
    ) {}

    public function handle(WebhookContactUpsertService $upserter): void
    {
        // El job corre sin usuario autenticado: TenantScope no filtra nada,
        // por eso withoutGlobalScopes + filtro manual por tenant.
        $delivery = WebhookDelivery::withoutGlobalScopes()
            ->where('tenant_id', $this->tenantId)
            ->find($this->deliveryId);

        if (! $delivery) {
            Log::warning('ProcessWebhookBulkImportJob: delivery no encontrado en el tenant', [
                'tenant_id' => $this->tenantId,
                'delivery_id' => $this->deliveryId,
            ]);

            return;
        }

        $endpoint = WebhookEndpoint::withoutGlobalScopes()
            ->where('tenant_id', $this->tenantId)
            ->find($delivery->webhook_endpoint_id);

        $items = $delivery->payload['contacts'] ?? null;

        if (! $endpoint || ! is_array($items) || $items === []) {
            $delivery->update([
                'status' => 'failed',
                'error' => 'Delivery bulk sin endpoint o sin contactos en el payload.',
            ]);

            return;
        }

        $delivery->update(['status' => 'processing']);

        $result = $upserter->process($endpoint, $items);

        $delivery->update([
            'status' => WebhookDelivery::statusFromResult($result),
            'result' => $result,
            // Procesado: el payload completo ya no hace falta como fuente,
            // se achica al tope de debug para no engordar la tabla.
            'payload' => WebhookDelivery::truncatePayload($delivery->payload),
        ]);
    }

    /**
     * Agotados los reintentos: el delivery queda 'failed' con el error para que
     * el cliente lo vea al consultar el status (y en la UI de deliveries).
     */
    public function failed(?\Throwable $e): void
    {
        WebhookDelivery::withoutGlobalScopes()
            ->where('tenant_id', $this->tenantId)
            ->where('id', $this->deliveryId)
            ->update([
                'status' => 'failed',
                'error' => $e?->getMessage() ?? 'Job failed.',
            ]);
    }
}
