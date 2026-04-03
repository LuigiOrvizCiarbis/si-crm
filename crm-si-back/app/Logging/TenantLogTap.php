<?php

namespace App\Logging;

use Illuminate\Log\Logger as IlluminateLogger;
use Monolog\Logger as MonologLogger;

class TenantLogTap
{
    public function __invoke(IlluminateLogger|MonologLogger $logger): void
    {
        $monolog = $logger instanceof IlluminateLogger
            ? $logger->getLogger()
            : $logger;

        $monolog->pushProcessor(new TenantProcessor());
    }
}
