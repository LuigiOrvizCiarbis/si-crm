<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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
            // Desactivar límite de tiempo de ejecución para esta conexión
            set_time_limit(0);

            // 2. Recuperar mensajes perdidos (Gap detection)
            // Antes de escuchar en vivo, enviamos lo que pasó desde el último ID que tiene el cliente
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

            // 3. Suscripción a Redis (Bloqueante pero eficiente)
            // El servidor se queda "dormido" aquí hasta que llega un evento
            try {
                $redis = Redis::connection();

                // Suscribirse al canal específico de esta conversación
                $redis->subscribe(['conversation.' . $conversation->id], function ($message) {
                    // Este callback se ejecuta cada vez que alguien hace Redis::publish
                    echo "event: message\n";
                    echo "data: " . $message . "\n\n";

                    if (ob_get_level() > 0) ob_flush();
                    flush();
                });
            } catch (\Exception $e) {
                // Si Redis falla o la conexión se cierra
                Log::error("Error en stream SSE Redis: " . $e->getMessage());
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}
