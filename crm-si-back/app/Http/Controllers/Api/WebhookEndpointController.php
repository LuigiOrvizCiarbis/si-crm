<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactField;
use App\Models\WebhookDelivery;
use App\Models\WebhookEndpoint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * CRUD de configuración de webhooks entrantes por tenant. Gated por
 * webhooks.view (lectura) / webhooks.manage (escritura). La API key en plano se
 * devuelve una única vez, al crear el endpoint o al rotar la key.
 */
class WebhookEndpointController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorizeView($request);

        $endpoints = WebhookEndpoint::query()
            ->where('tenant_id', $request->user()->tenant_id)
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => $endpoints->map(fn (WebhookEndpoint $e) => $this->transform($e))->all(),
        ]);
    }

    public function schema(Request $request): JsonResponse
    {
        $this->authorizeView($request);

        $fields = ContactField::query()
            ->where('tenant_id', $request->user()->tenant_id)
            ->orderBy('display_order')
            ->orderBy('id')
            ->get()
            ->map(fn (ContactField $field): array => [
                'key' => $field->key,
                'label' => $field->label,
                'type' => $field->type->value,
                'options' => $field->options,
                'is_required' => $field->is_required,
            ])
            ->all();

        return response()->json(['data' => $fields]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeManage($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'signing_secret' => ['nullable', 'string', 'max:255'],
        ]);

        $tenantId = $request->user()->tenant_id;
        $plainKey = WebhookEndpoint::generateApiKey();

        $endpoint = new WebhookEndpoint([
            'tenant_id' => $tenantId,
            'name' => $validated['name'],
            'slug' => $this->generateSlug($validated['name'], $tenantId),
            'target' => 'contacts',
            'enabled' => true,
        ]);
        $endpoint->setApiKey($plainKey);

        if (! empty($validated['signing_secret'])) {
            $endpoint->setEncryptedSigningSecret($validated['signing_secret']);
        }

        $endpoint->save();

        // api_key en plano: única vez que se muestra.
        return response()->json([
            'data' => $this->transform($endpoint) + ['api_key' => $plainKey],
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $this->authorizeManage($request);

        $endpoint = $this->findForTenant($request, $id);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'enabled' => ['sometimes', 'boolean'],
            // Write-only. String vacío = quitar el signing secret. Ausente = sin cambio.
            'signing_secret' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        if (array_key_exists('name', $validated)) {
            $endpoint->name = $validated['name'];
        }

        if (array_key_exists('enabled', $validated)) {
            $endpoint->enabled = $validated['enabled'];
        }

        if ($request->has('signing_secret')) {
            $secret = (string) ($validated['signing_secret'] ?? '');
            if ($secret === '') {
                $endpoint->signing_secret = null;
            } else {
                $endpoint->setEncryptedSigningSecret($secret);
            }
        }

        $endpoint->save();

        return response()->json(['data' => $this->transform($endpoint)]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->authorizeManage($request);

        $endpoint = $this->findForTenant($request, $id);
        $endpoint->delete();

        return response()->json(null, 204);
    }

    public function rotateKey(Request $request, int $id): JsonResponse
    {
        $this->authorizeManage($request);

        $endpoint = $this->findForTenant($request, $id);
        $plainKey = WebhookEndpoint::generateApiKey();
        $endpoint->setApiKey($plainKey);
        $endpoint->save();

        return response()->json([
            'data' => $this->transform($endpoint) + ['api_key' => $plainKey],
        ]);
    }

    public function deliveries(Request $request, int $id): JsonResponse
    {
        $this->authorizeView($request);

        $endpoint = $this->findForTenant($request, $id);

        $deliveries = $endpoint->deliveries()
            ->orderByDesc('id')
            ->paginate(min((int) $request->integer('per_page', 25), 100));

        $deliveries->getCollection()->transform(fn (WebhookDelivery $d) => $this->transformDeliverySummary($d));

        return response()->json($deliveries);
    }

    public function deliveryShow(Request $request, int $id, int $deliveryId): JsonResponse
    {
        $this->authorizeView($request);

        $endpoint = $this->findForTenant($request, $id);

        $delivery = $endpoint->deliveries()->findOrFail($deliveryId);

        return response()->json(['data' => $this->transformDeliveryDetail($delivery)]);
    }

    private function authorizeView(Request $request): void
    {
        $user = $request->user();
        if (! $user?->can('webhooks.view') && ! $user?->can('webhooks.manage')) {
            abort(403);
        }
    }

    private function authorizeManage(Request $request): void
    {
        if (! $request->user()?->can('webhooks.manage')) {
            abort(403);
        }
    }

    private function findForTenant(Request $request, int $id): WebhookEndpoint
    {
        return WebhookEndpoint::query()
            ->where('tenant_id', $request->user()->tenant_id)
            ->findOrFail($id);
    }

    private function generateSlug(string $name, int $tenantId): string
    {
        do {
            $slug = Str::slug($name).'-'.Str::lower(Str::random(6));
        } while (
            WebhookEndpoint::query()
                ->where('tenant_id', $tenantId)
                ->where('slug', $slug)
                ->exists()
        );

        return $slug;
    }

    /**
     * @return array<string, mixed>
     */
    private function transform(WebhookEndpoint $endpoint): array
    {
        return [
            'id' => $endpoint->id,
            'name' => $endpoint->name,
            'slug' => $endpoint->slug,
            'target' => $endpoint->target,
            'enabled' => $endpoint->enabled,
            'api_key_prefix' => $endpoint->api_key_prefix,
            'has_signing_secret' => $endpoint->hasSigningSecret(),
            'public_url' => $endpoint->public_url,
            'last_received_at' => $endpoint->last_received_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function transformDeliverySummary(WebhookDelivery $delivery): array
    {
        $result = $delivery->result ?? [];

        return [
            'id' => $delivery->id,
            'status' => $delivery->status,
            'http_status' => $delivery->http_status,
            'created' => $result['created'] ?? null,
            'updated' => $result['updated'] ?? null,
            'failed' => $result['failed'] ?? null,
            'created_at' => $delivery->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function transformDeliveryDetail(WebhookDelivery $delivery): array
    {
        return $this->transformDeliverySummary($delivery) + [
            'payload' => $delivery->payload,
            'result' => $delivery->result,
            'error' => $delivery->error,
            'ip' => $delivery->ip,
        ];
    }
}
