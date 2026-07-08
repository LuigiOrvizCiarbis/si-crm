<?php

namespace App\Enums;

enum AiProvider: string
{
    case CLAUDE = 'claude';
    case OPENAI = 'openai';

    /**
     * Obtener todos los valores posibles.
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Nombre legible del proveedor (para la UI).
     */
    public function label(): string
    {
        return match ($this) {
            self::CLAUDE => 'Claude (Anthropic)',
            self::OPENAI => 'OpenAI (GPT)',
        };
    }

    /**
     * Modelo por defecto sugerido para el proveedor.
     */
    public function defaultModel(): string
    {
        return match ($this) {
            self::CLAUDE => 'claude-opus-4-8',
            self::OPENAI => 'gpt-4o',
        };
    }

    /**
     * Mínimo de tokens que debe tener el system prompt para que aplique el
     * prompt caching. Bajo este umbral el bloque cacheable se ignora.
     * OpenAI cachea automáticamente desde 1024 tokens de prompt.
     */
    public function cacheMinTokens(): int
    {
        return match ($this) {
            self::CLAUDE => 4096, // Opus 4.x; Sonnet 4.6=2048, 4.5=1024
            self::OPENAI => 1024,
        };
    }

    /**
     * Heurística de "el modelo procesa imágenes", para avisarle al tenant que
     * las fotos entrantes de WhatsApp se ignorarían con el modelo elegido.
     *
     * Es conservadora a propósito: casi todos los modelos actuales (Claude 3+ y
     * GPT-4+) tienen visión, y los ids cambian seguido, así que mantener una
     * lista blanca exacta se desactualizaría. En su lugar solo devolvemos false
     * para familias que SABEMOS que no procesan imágenes; ante un id desconocido
     * asumimos que sí (no molestar de más). No es un gate: aunque acierte el
     * "no", generate() igual degrada la imagen a un placeholder de texto.
     */
    public function modelSupportsVision(string $model): bool
    {
        $model = strtolower(trim($model));

        if ($model === '') {
            return true;
        }

        // El gpt-4 "base" (original, sin visión) es "gpt-4" o "gpt-4-<fecha>",
        // pero NO gpt-4-turbo (multimodal). Se maneja aparte del prefijo genérico.
        if ($this === self::OPENAI
            && ($model === 'gpt-4' || (str_starts_with($model, 'gpt-4-') && ! str_starts_with($model, 'gpt-4-turbo')))) {
            return false;
        }

        $textOnlyPrefixes = match ($this) {
            // GPT-3.5 (todas las variantes) no procesa imágenes; o1-mini/o3-mini
            // y los modelos de audio/transcripción/legacy tampoco.
            self::OPENAI => [
                'gpt-3.5',
                'gpt-4o-mini-tts',
                'gpt-4o-mini-transcribe',
                'gpt-4o-transcribe',
                'o1-mini',
                'o3-mini',
                'text-',
                'davinci',
                'babbage',
            ],
            // Claude 1/2 (pre-3) eran text-only; de Claude 3 en adelante todos
            // tienen visión.
            self::CLAUDE => [
                'claude-1',
                'claude-2',
                'claude-instant',
            ],
        };

        foreach ($textOnlyPrefixes as $prefix) {
            if (str_starts_with($model, $prefix)) {
                return false;
            }
        }

        return true;
    }
}
