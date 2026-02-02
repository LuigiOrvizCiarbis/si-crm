<?php

namespace App\Enums;

enum MessageDirection: string
{
    case INBOUND = 'inbound';
    case OUTBOUND = 'outbound';

    /**
     * Obtener todos los valores posibles
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Obtener la descripción de la dirección
     */
    public function label(): string
    {
        return match($this) {
            self::INBOUND => 'Entrante',
            self::OUTBOUND => 'Saliente',
        };
    }

    /**
     * Verificar si es un mensaje entrante
     */
    public function isInbound(): bool
    {
        return $this === self::INBOUND;
    }

    /**
     * Verificar si es un mensaje saliente
     */
    public function isOutbound(): bool
    {
        return $this === self::OUTBOUND;
    }
}
