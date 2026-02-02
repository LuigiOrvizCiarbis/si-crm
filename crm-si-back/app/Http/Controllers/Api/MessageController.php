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


    public function store(Request $request)
    {
        $data = $request->validate([
            'conversation_id' => 'required|exists:conversations,id',
            'content' => 'required|string',
            'type' => 'string|in:text',
        ]);

        $conversation = Conversation::findOrFail($data['conversation_id']);

        $message = $this->messageService->sendTextMessageFromCRM($conversation, $data['content'], $request->user());

        return response()->json(['data' => $message], 201);
    }
}
