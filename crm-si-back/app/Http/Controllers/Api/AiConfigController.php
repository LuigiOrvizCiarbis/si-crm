<?php

namespace App\Http\Controllers\Api;

use App\Enums\AiProvider;
use App\Http\Controllers\Controller;
use App\Models\AiConfig;
use App\Services\Ai\AiProviderFactory;
use App\Services\AiReplyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AiConfigController extends Controller
{
    /**
     * Config de IA del tenant. Nunca devuelve la API key: solo un flag
     * has_api_key para que la UI sepa si ya hay una cargada.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user?->can('ai_config.view') && ! $user?->can('ai_config.manage')) {
            abort(403);
        }

        $config = AiConfig::where('tenant_id', $user->tenant_id)->first();

        return response()->json([
            'data' => $this->transform($config),
        ]);
    }

    /**
     * Crea o actualiza la config de IA del tenant. La API key es write-only:
     * si viene no vacía se encripta; si viene vacía o ausente, se conserva.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user?->can('ai_config.manage')) {
            abort(403);
        }

        $validated = $request->validate([
            'provider' => ['required', Rule::in(AiProvider::values())],
            'model' => ['nullable', 'string', 'max:255'],
            'enabled' => ['required', 'boolean'],
            'system_prompt' => ['nullable', 'string', 'max:5000'],
            'api_key' => ['nullable', 'string', 'max:500'],
        ]);

        $config = AiConfig::firstOrNew(['tenant_id' => $user->tenant_id]);
        $config->tenant_id = $user->tenant_id;
        $config->provider = $validated['provider'];
        $config->model = $validated['model'] ?? null;
        $config->enabled = $validated['enabled'];
        $config->system_prompt = $validated['system_prompt'] ?? null;
        $config->save();

        // La key se setea aparte (encriptada) y solo si el usuario mandó una nueva.
        if (! empty($validated['api_key'])) {
            $config->setEncryptedApiKey($validated['api_key']);
        }

        return response()->json([
            'data' => $this->transform($config->fresh()),
        ]);
    }

    /**
     * Lista los modelos disponibles para el proveedor y la API key ya guardadas
     * del tenant. Requiere una key cargada: sin ella no hay con qué consultar.
     */
    public function models(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user?->can('ai_config.view') && ! $user?->can('ai_config.manage')) {
            abort(403);
        }

        $config = AiConfig::where('tenant_id', $user->tenant_id)->first();

        if (! $config || ! $config->getDecryptedApiKey()) {
            return response()->json(['data' => []]);
        }

        $provider = AiProviderFactory::make($config);

        return response()->json([
            'data' => $provider?->listModels() ?? [],
        ]);
    }

    /**
     * Prueba la conexión con el proveedor: valida la API key, mide el system
     * prompt y distingue key inválida / saldo insuficiente / rate limit. Usa la
     * key nueva si el usuario mandó una; si no, la ya guardada. Así el tenant
     * detecta el problema al configurar, no cuando llega el primer WhatsApp.
     */
    public function test(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user?->can('ai_config.manage')) {
            abort(403);
        }

        $validated = $request->validate([
            'provider' => ['required', Rule::in(AiProvider::values())],
            'model' => ['nullable', 'string', 'max:255'],
            'system_prompt' => ['nullable', 'string', 'max:5000'],
            'api_key' => ['nullable', 'string', 'max:500'],
        ]);

        $provider = AiProvider::from($validated['provider']);
        $config = AiConfig::where('tenant_id', $user->tenant_id)->first();

        // Key: la nueva del request tiene prioridad; si no, la guardada.
        $apiKey = ! empty($validated['api_key'])
            ? $validated['api_key']
            : $config?->getDecryptedApiKey();

        if (! $apiKey) {
            return response()->json([
                'data' => [
                    'ok' => false,
                    'error_code' => 'invalid_key',
                    'error_message' => 'No hay API key para probar.',
                    'prompt_tokens' => null,
                    'cache_min_tokens' => $provider->cacheMinTokens(),
                ],
            ], 422);
        }

        $model = $validated['model'] ?: $provider->defaultModel();
        $systemPrompt = $validated['system_prompt']
            ?: $config?->system_prompt
            ?: AiReplyService::DEFAULT_SYSTEM_PROMPT;

        $driver = AiProviderFactory::makeWithKey($provider, $apiKey);

        $result = $driver->verify(trim($systemPrompt), $model);

        return response()->json([
            'data' => [
                ...$result->toArray(),
                'cache_min_tokens' => $provider->cacheMinTokens(),
            ],
        ]);
    }

    /**
     * Serializa la config sin exponer la API key.
     *
     * @return array<string, mixed>
     */
    private function transform(?AiConfig $config): array
    {
        if (! $config) {
            return [
                'provider' => null,
                'model' => null,
                'enabled' => false,
                'system_prompt' => null,
                'has_api_key' => false,
            ];
        }

        return [
            'provider' => $config->provider->value,
            'model' => $config->model,
            'enabled' => $config->enabled,
            'system_prompt' => $config->system_prompt,
            'has_api_key' => ! empty($config->api_key),
        ];
    }
}
