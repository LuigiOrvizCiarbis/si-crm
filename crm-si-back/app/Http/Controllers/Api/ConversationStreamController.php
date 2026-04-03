<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class ConversationStreamController extends Controller
{
    public function stream(Request $request, $conversationId)
    {
        // 1. Validar acceso y tenant
        $user = $request->user();
        $conversation = Conversation::where('id', $conversationId)
            ->where('tenant_id', $user->tenant_id)
            ->firstOrFail();

        return response()->stream(function () use ($conversation, $request) {
            $maxLifetime = 90; // seconds — frontend auto-reconnects
            set_time_limit($maxLifetime + 10);
            $startTime = time();

            // 2. Recuperar mensajes perdidos (Gap detection)
            $lastMessageId = $request->input('last_id', 0);

            if ($lastMessageId > 0) {
                $missedMessages = Message::where('conversation_id', $conversation->id)
                    ->where('id', '>', $lastMessageId)
                    ->orderBy('id', 'asc')
                    ->get();

                foreach ($missedMessages as $message) {
                    echo "event: message\n";
                    echo "data: " . json_encode($message) . "\n\n";
                }
                if (ob_get_level() > 0) ob_flush();
                flush();
            }

            // Liberar conexión DB antes del subscribe
            DB::disconnect('pgsql');

            // 3. Suscripción a Redis con timeout para liberar workers
            $channel = 'conversation.' . $conversation->id;

            while (! connection_aborted() && (time() - $startTime) < $maxLifetime) {
                try {
                    // Conexión 'sse' tiene read_write_timeout=10s para que subscribe
                    // lance excepción periódicamente y podamos evaluar el tiempo
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
