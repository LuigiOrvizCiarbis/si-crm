<?php

namespace App\Services\Ai;

use App\Models\AiConfig;

class TranslationProviderFactory
{
    public function make(AiConfig $config): ?AiProvider
    {
        return AiProviderFactory::make($config);
    }
}
