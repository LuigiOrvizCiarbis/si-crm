<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class TenantStreamController extends Controller
{
    public function stream(Request $request)
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        return response()->stream(function () use ($tenantId) {
            set_time_limit(0);

            echo "event: init\n";
            echo "data: " . json_encode(['status' => 'connected', 'tenant_id' => $tenantId]) . "\n\n";
            if (ob_get_level() > 0) ob_flush();
            flush();

            // Liberar conexión DB antes del subscribe bloqueante
            DB::disconnect('pgsql');

            try {
                $redis = Redis::connection();

                $redis->subscribe(['tenant.' . $tenantId], function ($message) {
                    echo "event: message\n";
                    echo "data: " . $message . "\n\n";

                    if (ob_get_level() > 0) ob_flush();
                    flush();
                });
            } catch (\Exception $e) {
                Log::error("Error en tenant stream SSE: " . $e->getMessage());
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}
