<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\WhatsAppMessageService;
use Symfony\Component\HttpFoundation\JsonResponse;

class MessageController extends Controller
{
    public function __construct(
        private WhatsAppMessageService $messageService
    ) {}
    public function index(Request $request, Conversation $conversation): JsonResponse
    {

        $messages = Message::query()
            ->where('conversation_id', $conversation->id)
            ->orderBy('delivered_at')
            ->paginate((int) $request->query('per_page', 50));

        return response()->json([
            'data' => $messages->items(),
            'meta' => [
                'total' => $messages->total(),
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
            ]
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
}
