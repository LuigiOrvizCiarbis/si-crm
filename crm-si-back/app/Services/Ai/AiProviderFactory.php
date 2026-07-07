<?php

namespace App\Services\Ai;

use App\Enums\AiProvider as AiProviderEnum;
use App\Models\AiConfig;
use App\Services\Ai\Providers\AnthropicProvider;
use App\Services\Ai\Providers\OpenAiProvider;

class AiProviderFactory
{
    /**
     * Construye el driver correspondiente a la config del tenant, con la API
     * key ya desencriptada. Devuelve null si falta la key.
     */
    public static function make(AiConfig $config): ?AiProvider
    {
        $apiKey = $config->getDecryptedApiKey();

        if (! $apiKey) {
            return null;
        }

        return self::makeWithKey($config->provider, $apiKey);
    }

    /**
     * Construye el driver de un proveedor con una API key arbitraria (no
     * necesariamente la guardada). Lo usa el flujo "probar conexión", que
     * valida una key antes de persistirla. Devuelve null si el proveedor no
     * está soportado.
     */
    public static function makeWithKey(AiProviderEnum $provider, string $apiKey): ?AiProvider
    {
        return match ($provider) {
            AiProviderEnum::CLAUDE => new AnthropicProvider($apiKey),
            AiProviderEnum::OPENAI => new OpenAiProvider($apiKey),
        };
    }
}
