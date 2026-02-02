<?php

namespace App\Enums;

enum SenderType: string
{
    case CONTACT = 'contact';
    case USER = 'user';
    case SYSTEM = 'system';

    /**
     * Obtener todos los valores posibles
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Obtener la descripción del tipo de remitente
     */
    public function label(): string
    {
        return match($this) {
            self::CONTACT => 'Contacto',
            self::USER => 'Usuario',
            self::SYSTEM => 'Sistema',
        };
    }
}
