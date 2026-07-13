<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\TranslationException;
use App\Http\Controllers\Controller;
use App\Http\Requests\TranslateMessageRequest;
use App\Models\Message;
use App\Services\MessageTranslationService;
use Illuminate\Http\JsonResponse;

class MessageTranslationController extends Controller
{
    public function __construct(private MessageTranslationService $translations) {}

    public function store(TranslateMessageRequest $request, Message $message): JsonResponse
    {
        $this->authorize('view', $message);

        try {
            $result = $this->translations->translateMessage(
                $message,
                $request->validated('target_language'),
            );
        } catch (TranslationException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'code' => $exception->errorCode,
            ], $exception->status);
        }

        return response()->json([
            'data' => [
                'message_id' => $message->id,
                'target_language' => $result['translation']->target_language,
                'translated_content' => $result['translation']->translated_content,
                'cached' => $result['cached'],
            ],
        ]);
    }
}
