<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageDeleted;
use App\Events\MessageEdited;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateMessageRequest;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\WhatsAppMessageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\JsonResponse;

class MessageController extends Controller
{
    public function __construct(
        private WhatsAppMessageService $messageService
    ) {}

    public function index(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        $messages = Message::query()
            ->withTrashed()
            ->where('conversation_id', $conversation->id)
            ->orderBy('delivered_at')
            ->paginate((int) $request->query('per_page', 50));

        return response()->json([
            'data' => $messages->items(),
            'meta' => [
                'total' => $messages->total(),
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'conversation_id' => 'required|exists:conversations,id',
            'content' => 'required_unless:type,image,audio|nullable|string',
            'type' => 'required|string|in:text,image,audio',
            'image' => 'required_if:type,image|image|max:10240',
            'audio' => 'required_if:type,audio|file|mimetypes:audio/aac,audio/mpeg,audio/mp3,audio/ogg,audio/mp4,audio/amr,audio/3gpp|max:16384',
        ]);

        $conversation = Conversation::query()
            ->with(['channel.whatsappConfig', 'contact'])
            ->whereKey($data['conversation_id'])
            ->where('tenant_id', $request->user()->tenant_id)
            ->firstOrFail();

        $this->authorize('sendMessage', $conversation);

        $type = $data['type'] ?? 'text';
        $tenantId = $request->user()->tenant_id;

        try {
            if ($type === 'image' && $request->hasFile('image')) {
                $file = $request->file('image');
                $path = $file->store("messages/{$tenantId}", 'public');

                $message = $this->messageService->sendImageMessageFromCRM(
                    $conversation,
                    $path,
                    '/storage/'.$path,
                    $file->getMimeType(),
                    $data['content'] ?? null,
                    $request->user()
                );
            } elseif ($type === 'audio' && $request->hasFile('audio')) {
                $file = $request->file('audio');
                $path = $file->store("messages/{$tenantId}", 'public');

                $message = $this->messageService->sendAudioMessageFromCRM(
                    $conversation,
                    $path,
                    '/storage/'.$path,
                    $file->getMimeType() ?: 'audio/mpeg',
                    $request->user()
                );
            } else {
                $message = $this->messageService->sendTextMessageFromCRM(
                    $conversation,
                    $data['content'],
                    $request->user()
                );
            }
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\RuntimeException $e) {
            // El mensaje de la excepción incluye el body crudo de Meta; detectamos
            // el code 190 (token expirado/revocado) para dar una instrucción accionable
            // al usuario en lugar de un genérico.
            $tokenExpired = str_contains($e->getMessage(), '"code":190')
                || str_contains($e->getMessage(), 'OAuthException');

            $logContext = [
                'conversation_id' => $conversation->id,
                'tenant_id' => $request->user()->tenant_id,
                'user_id' => $request->user()->id,
                'type' => $type,
                'token_expired' => $tokenExpired,
                'error' => $e->getMessage(),
            ];

            if ($tokenExpired) {
                Log::warning('Token de WhatsApp expirado o revocado al enviar mensaje', $logContext);
            } else {
                Log::error('No se pudo enviar el mensaje por WhatsApp', $logContext);
            }

            $errorMessage = $tokenExpired
                ? 'La conexión de WhatsApp expiró. Reconectá el canal desde Configuración para volver a enviar mensajes.'
                : 'No se pudo enviar el mensaje a WhatsApp. Verifica la configuración del canal e inténtalo de nuevo.';

            // 422: es un problema de configuración del canal (dependencia upstream),
            // no una caída de gateway. Así el front muestra el mensaje al usuario.
            return response()->json(['message' => $errorMessage], 422);
        }

        return response()->json(['data' => $message], 201);
    }

    public function update(UpdateMessageRequest $request, Message $message): JsonResponse
    {
        $this->authorize('update', $message);

        if ($message->original_content === null) {
            $message->original_content = $message->content;
        }

        $message->update([
            'content' => $request->validated('content'),
            'edited_at' => now(),
            'original_content' => $message->original_content,
        ]);
        $message->translations()->delete();

        try {
            broadcast(new MessageEdited($message->fresh()));
        } catch (\Exception $e) {
            Log::error('Error broadcasting message edited: '.$e->getMessage());
        }

        return response()->json(['data' => $message->fresh()]);
    }

    public function destroy(Request $request, Message $message): JsonResponse
    {
        $this->authorize('delete', $message);

        $conversationId = $message->conversation_id;
        $message->translations()->delete();
        $message->delete();

        try {
            broadcast(new MessageDeleted($message, $conversationId));
        } catch (\Exception $e) {
            Log::error('Error broadcasting message deleted: '.$e->getMessage());
        }

        return response()->json(['message' => 'Mensaje eliminado']);
    }
}
