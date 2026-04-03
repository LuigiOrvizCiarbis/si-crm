<?php

namespace App\Logging;

use Monolog\Logger;

class TenantLogTap
{
    public function __invoke(Logger $logger): void
    {
        $logger->pushProcessor(new TenantProcessor());
    }
}
