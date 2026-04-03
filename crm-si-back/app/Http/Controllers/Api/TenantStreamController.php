<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class TenantStreamController extends Controller
{
    public function stream(Request $request)
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        return response()->stream(function () use ($tenantId) {
            $maxLifetime = 90; // seconds — frontend auto-reconnects
            set_time_limit($maxLifetime + 10);
            $startTime = time();

            echo "event: init\n";
            echo "data: " . json_encode(['status' => 'connected', 'tenant_id' => $tenantId]) . "\n\n";
            if (ob_get_level() > 0) ob_flush();
            flush();

            // Liberar conexión DB antes del subscribe
            DB::disconnect('pgsql');

            $channel = 'tenant.' . $tenantId;

            while (! connection_aborted() && (time() - $startTime) < $maxLifetime) {
                try {
                    Redis::connection('sse')->subscribe([$channel], function ($message) use ($startTime, $maxLifetime) {
                        echo "event: message\n";
                        echo "data: {$message}\n\n";

                        if (ob_get_level() > 0) ob_flush();
                        flush();

                        if ((time() - $startTime) >= $maxLifetime) {
                            throw new \RuntimeException('SSE max lifetime reached');
                        }
                    });
                } catch (\RuntimeException $e) {
                    break;
                } catch (\Exception $e) {
                    // Read timeout from Predis — loop will check elapsed time
                    continue;
                }
            }

            echo "event: reconnect\n";
            echo "data: {}\n\n";
            if (ob_get_level() > 0) ob_flush();
            flush();
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}
