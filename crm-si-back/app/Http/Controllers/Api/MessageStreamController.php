<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MessageStreamController extends Controller
{
    /**
     * Stream messages for a specific conversation
     *
     * @param Request $request
     * @param int $conversationId
     * @return StreamedResponse
     */
    public function streamConversation(Request $request, int $conversationId): StreamedResponse
    {
        // El scope BelongsToTenant ya filtró por tenant_id automáticamente

        return response()->stream(function () use ($conversationId): void {
            // Configurar para evitar timeout
            set_time_limit(0);

            // Enviar mensajes iniciales
            $this->sendInitialMessages($conversationId);

            // Track del último mensaje procesado
            $lastMessageId = Message::where('conversation_id', $conversationId)
                ->max('id') ?? 0;

            // Loop de polling para nuevos mensajes
            while (true) {
                // Verificar si la conexión sigue activa
                if (connection_aborted()) {
                    break;
                }

                // Buscar mensajes nuevos
                $newMessages = Message::where('conversation_id', $conversationId)
                    ->where('id', '>', $lastMessageId)
                    ->orderBy('id', 'asc')
                    ->get();

                if ($newMessages->isNotEmpty()) {
                    foreach ($newMessages as $message) {
                        $this->sendMessage($message);
                        $lastMessageId = $message->id;
                    }
                }

                // Liberar conexión DB entre polls para no agotar max_connections
                DB::disconnect('pgsql');

                // Enviar heartbeat cada 15 segundos para mantener conexión
                $this->sendHeartbeat();

                // Esperar 2 segundos antes de siguiente check
                sleep(2);
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no', // Deshabilitar buffering de Nginx
        ]);
    }

    /**
     * Send initial batch of messages
     *
     * @param int $conversationId
     * @return void
     */
    private function sendInitialMessages(int $conversationId): void
    {
        $messages = Message::where('conversation_id', $conversationId)
            // Remover el ->with('sender')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) {
                return $this->formatMessage($message);
            });

        echo "data: " . json_encode([
            'type' => 'init',
            'data' => $messages
        ]) . "\n\n";

        if (ob_get_level() > 0) {
            ob_flush();
        }
        flush();
    }

    private function sendMessage(Message $message): void
    {
        // Remover el ->load('sender')

        echo "data: " . json_encode([
            'type' => 'message',
            'data' => $this->formatMessage($message)
        ]) . "\n\n";

        if (ob_get_level() > 0) {
            ob_flush();
        }
        flush();
    }

    /**
     * Send heartbeat to keep connection alive
     *
     * @return void
     */
    private function sendHeartbeat(): void
    {
        static $lastHeartbeat = 0;

        if (time() - $lastHeartbeat >= 15) {
            echo ": heartbeat\n\n";

            if (ob_get_level() > 0) {
                ob_flush();
            }
            flush();

            $lastHeartbeat = time();
        }
    }

    /**
     * Format message for frontend consumption
     *
     * @param Message $message
     * @return array
     */
    private function formatMessage(Message $message): array
    {
        return [
            'id' => $message->id,
            'conversation_id' => $message->conversation_id,
            'sender_type' => $message->sender_type->value,
            'sender_id' => $message->sender_id,
            'content' => $message->content,
            'direction' => $message->direction->value,
            'external_id' => $message->external_id,
            'delivered_at' => $message->delivered_at?->toISOString(),
            'read_at' => $message->read_at?->toISOString(),
            'created_at' => $message->created_at->toISOString(),
        ];
    }
}
