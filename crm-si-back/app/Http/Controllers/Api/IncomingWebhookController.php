<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WebhookDelivery;
use App\Models\WebhookEndpoint;
use App\Services\WebhookContactUpsertService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Endpoint público de recepción de webhooks entrantes. Vive FUERA de auth:sanctum
 * (se autentica con X-Api-Key por endpoint). Hace upsert idempotente de contactos
 * y registra cada recepción en webhook_deliveries.
 */
class IncomingWebhookController extends Controller
{
    /** Tope de tamaño del payload persistido en el delivery (~64KB). */
    private const PAYLOAD_MAX_BYTES = 65536;

    public function __construct(private readonly WebhookContactUpsertService $upserter) {}

    public function handle(Request $request, string $slug): JsonResponse
    {
        $endpoint = $this->resolveEndpoint($request, $slug);

        // 401 uniforme: no revelamos si el slug existe, si la key es de otro
        // endpoint, ni si el target no está soportado. Sin delivery (anti-flood).
        if (! $endpoint) {
            return $this->unauthorized();
        }

        if (! $endpoint->enabled) {
            return response()->json(['message' => 'Webhook endpoint disabled.'], 403);
        }

        // Firma HMAC obligatoria solo si el endpoint tiene signing secret. Inválida
        // o ausente → 401 sin delivery (mismo patrón anti-flood).
        if ($endpoint->hasSigningSecret() && ! $this->isValidSignature($request, $endpoint)) {
            return $this->unauthorized();
        }

        $validator = Validator::make($request->all(), [
            'contacts' => ['required', 'array', 'min:1', 'max:500'],
            'contacts.*.external_id' => ['required', 'string', 'max:255'],
            'contacts.*.name' => ['required', 'string', 'max:255'],
            'contacts.*.email' => ['nullable', 'email', 'max:255'],
            'contacts.*.phone' => ['nullable', 'string', 'max:50'],
            'contacts.*.custom_data' => ['nullable', 'array'],
        ]);

        if ($validator->fails()) {
            $delivery = $this->recordDelivery($endpoint, $request, 'rejected', 422, [
                'errors' => $validator->errors()->all(),
            ]);

            return response()->json([
                'delivery_id' => $delivery->id,
                'message' => 'Invalid payload.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $items = $validator->validated()['contacts'];

        $delivery = $this->recordDelivery($endpoint, $request, 'received', null, null);

        try {
            $result = $this->upserter->process($endpoint, $items);
        } catch (\Throwable $e) {
            $delivery->update([
                'status' => 'failed',
                'http_status' => 500,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }

        $delivery->update([
            'status' => $this->statusFromResult($result),
            'http_status' => 200,
            'result' => $result,
        ]);

        $endpoint->forceFill(['last_received_at' => now()])->save();

        return response()->json([
            'delivery_id' => $delivery->id,
            'created' => $result['created'],
            'updated' => $result['updated'],
            'failed' => $result['failed'],
            'errors' => $result['errors'],
        ]);
    }

    private function resolveEndpoint(Request $request, string $slug): ?WebhookEndpoint
    {
        $apiKey = $request->header('X-Api-Key');

        if (! $apiKey) {
            return null;
        }

        $endpoint = WebhookEndpoint::query()
            ->where('api_key_hash', hash('sha256', $apiKey))
            ->first();

        if (! $endpoint || ! hash_equals($endpoint->slug, $slug) || $endpoint->target !== 'contacts') {
            return null;
        }

        return $endpoint;
    }

    /**
     * Valida X-Signature-256 (HMAC-SHA256 del raw body con el signing secret del
     * endpoint). Mismo patrón que InstagramController::isValidSignature pero con
     * secret por endpoint.
     */
    private function isValidSignature(Request $request, WebhookEndpoint $endpoint): bool
    {
        $signature = $request->header('X-Signature-256');
        $secret = $endpoint->getDecryptedSigningSecret();

        if (! $signature || ! $secret) {
            return false;
        }

        $expected = 'sha256='.hash_hmac('sha256', $request->getContent(), $secret);

        return hash_equals($expected, $signature);
    }

    /**
     * @param  array{created: int, updated: int, failed: int, errors: array<int, mixed>}  $result
     */
    private function statusFromResult(array $result): string
    {
        if ($result['failed'] === 0) {
            return 'processed';
        }

        return ($result['created'] + $result['updated']) > 0 ? 'partial' : 'failed';
    }

    /**
     * @param  array<string, mixed>|null  $result
     */
    private function recordDelivery(WebhookEndpoint $endpoint, Request $request, string $status, ?int $httpStatus, ?array $result): WebhookDelivery
    {
        return WebhookDelivery::create([
            'tenant_id' => $endpoint->tenant_id,
            'webhook_endpoint_id' => $endpoint->id,
            'status' => $status,
            'http_status' => $httpStatus,
            'payload' => $this->truncatePayload($request->all()),
            'result' => $result,
            'ip' => $request->ip(),
        ]);
    }

    /**
     * Evita persistir payloads enormes (batches de 500 con custom_data). Si el JSON
     * supera el tope, se guarda un resumen en lugar del cuerpo completo.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function truncatePayload(array $payload): array
    {
        $encoded = json_encode($payload);

        if ($encoded !== false && strlen($encoded) <= self::PAYLOAD_MAX_BYTES) {
            return $payload;
        }

        return [
            '_truncated' => true,
            'contacts_count' => is_array($payload['contacts'] ?? null) ? count($payload['contacts']) : null,
        ];
    }

    private function unauthorized(): JsonResponse
    {
        return response()->json(['message' => 'Unauthorized.'], 401);
    }
}
