<?php

namespace App\Enums;

enum TaskPriority: string
{
    case LOW = 'baja';
    case MEDIUM = 'media';
    case HIGH = 'alta';
    case CRITICAL = 'critica';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
