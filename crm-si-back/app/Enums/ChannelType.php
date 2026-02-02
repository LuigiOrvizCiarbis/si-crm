<?php

namespace App\Enums;

enum ChannelType: int
{
    case WHATSAPP = 1;
    case INSTAGRAM = 2;
    case FACEBOOK = 3;
    case LINKEDIN = 4;
    case TELEGRAM = 5;
    case WEB = 6;
    case MAIL = 7;
    case MANUAL = 8;
}
