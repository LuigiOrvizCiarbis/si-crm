<?php

namespace App\Http\Controllers\Api;

use App\Enums\SenderType;
use App\Enums\UserRole;
use App\Events\MessageDeleted;
use App\Events\MessageEdited;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateMessageRequest;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\WhatsAppMessageService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

class MessageController extends Controller
{
    public function __construct(
        private WhatsAppMessageService $messageService
    ) {}

    public function index(Request $request, Conversation $conversation): JsonResponse
    {
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
            'content' => 'required_unless:type,image|nullable|string',
            'type' => 'required|string|in:text,image',
            'image' => 'required_if:type,image|image|max:10240',
        ]);

        $conversation = Conversation::findOrFail($data['conversation_id']);
        $type = $data['type'] ?? 'text';

        if ($type === 'image' && $request->hasFile('image')) {
            $file = $request->file('image');
            $tenantId = $request->user()->tenant_id;
            $path = $file->store("messages/{$tenantId}", 'public');

            $message = $this->messageService->sendImageMessageFromCRM(
                $conversation,
                $path,
                '/storage/' . $path,
                $file->getMimeType(),
                $data['content'] ?? null,
                $request->user()
            );
        } else {
            $message = $this->messageService->sendTextMessageFromCRM(
                $conversation,
                $data['content'],
                $request->user()
            );
        }

        return response()->json(['data' => $message], 201);
    }

    public function update(UpdateMessageRequest $request, Message $message): JsonResponse
    {
        if ($message->original_content === null) {
            $message->original_content = $message->content;
        }

        $message->update([
            'content' => $request->validated('content'),
            'edited_at' => now(),
            'original_content' => $message->original_content,
        ]);

        try {
            broadcast(new MessageEdited($message->fresh()));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error broadcasting message edited: ' . $e->getMessage());
        }

        return response()->json(['data' => $message->fresh()]);
    }

    public function destroy(Request $request, Message $message): JsonResponse
    {
        $user = $request->user();

        if ($message->tenant_id !== $user->tenant_id) {
            abort(403, 'No autorizado');
        }

        $isOwner = $message->sender_type === SenderType::USER && $message->sender_id === $user->id;
        $isAdmin = $user->role === UserRole::ADMIN;

        if (! $isOwner && ! $isAdmin) {
            abort(403, 'No autorizado');
        }

        $conversationId = $message->conversation_id;
        $message->delete();

        try {
            broadcast(new MessageDeleted($message, $conversationId));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error broadcasting message deleted: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Mensaje eliminado']);
    }
}
