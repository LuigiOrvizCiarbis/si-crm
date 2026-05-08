<?php

namespace App\Enums;

enum TaskStatus: string
{
    case NEW = 'nuevo';
    case IN_PROGRESS = 'en-curso';
    case WAITING = 'en-espera';
    case RESCHEDULED = 'reprogramado';
    case BLOCKED = 'bloqueado';
    case DONE = 'hecho';
    case CANCELED = 'cancelado';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
