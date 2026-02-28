<?php

namespace App\Enums;

enum TemplateStatus: string
{
    case Approved = 'APPROVED';
    case Pending = 'PENDING';
    case Rejected = 'REJECTED';
    case Disabled = 'DISABLED';

    /**
     * Obtener todos los valores posibles
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Obtener la descripción del estado
     */
    public function label(): string
    {
        return match ($this) {
            self::Approved => 'Aprobado',
            self::Pending => 'Pendiente',
            self::Rejected => 'Rechazado',
            self::Disabled => 'Deshabilitado',
        };
    }

    /**
     * Verificar si el template está aprobado
     */
    public function isApproved(): bool
    {
        return $this === self::Approved;
    }
}
