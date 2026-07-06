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
}
