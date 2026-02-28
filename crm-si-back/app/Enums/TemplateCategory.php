<?php

namespace App\Enums;

enum TemplateCategory: string
{
    case Marketing = 'MARKETING';
    case Utility = 'UTILITY';
    case Authentication = 'AUTHENTICATION';

    /**
     * Obtener todos los valores posibles
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Obtener la descripción de la categoría
     */
    public function label(): string
    {
        return match ($this) {
            self::Marketing => 'Marketing',
            self::Utility => 'Utilidad',
            self::Authentication => 'Autenticación',
        };
    }
}
