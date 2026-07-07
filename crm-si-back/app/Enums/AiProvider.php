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
}
