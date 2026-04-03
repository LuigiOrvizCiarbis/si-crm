<?php

namespace App\Logging;

use Monolog\LogRecord;

class TenantProcessor
{
    public function __invoke(LogRecord $record): LogRecord
    {
        $user = auth()->user();

        if (! $user) {
            return $record;
        }

        $extra = $record->extra;

        if (isset($user->tenant_id)) {
            $extra['tenant_id'] = $user->tenant_id;
        }

        if (isset($user->id)) {
            $extra['user_id'] = $user->id;
        }

        return $record->with(extra: $extra);
    }
}
