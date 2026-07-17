<?php

namespace App\Enums;

enum AutomationRuleStatus: string
{
    case Draft = 'draft';
    case Active = 'active';
    case Paused = 'paused';
}
