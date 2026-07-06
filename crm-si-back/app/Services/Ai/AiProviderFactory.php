<?php

namespace App\Services\Ai;

use App\Enums\AiProvider as AiProviderEnum;
use App\Models\AiConfig;
use App\Services\Ai\Providers\AnthropicProvider;
use App\Services\Ai\Providers\OpenAiProvider;
use Illuminate\Support\Facades\Log;

class AiProviderFactory
{
    /**
     * Construye el driver correspondiente a la config del tenant, con la API
     * key ya desencriptada. Devuelve null si falta la key o el proveedor no
     * está soportado (loguea).
     */
    public static function make(AiConfig $config): ?AiProvider
    {
        $apiKey = $config->getDecryptedApiKey();

        if (! $apiKey) {
            return null;
        }

        return match ($config->provider) {
            AiProviderEnum::CLAUDE => new AnthropicProvider($apiKey),
            AiProviderEnum::OPENAI => new OpenAiProvider($apiKey),
            default => self::unsupported($config),
        };
    }

    private static function unsupported(AiConfig $config): ?AiProvider
    {
        Log::warning('AiProviderFactory: proveedor no soportado', [
            'tenant_id' => $config->tenant_id,
            'provider' => $config->provider,
        ]);

        return null;
    }
}
