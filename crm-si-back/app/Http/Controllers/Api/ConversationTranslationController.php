<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\TranslationException;
use App\Http\Controllers\Controller;
use App\Http\Requests\TranslateDraftRequest;
use App\Http\Requests\UpdateTranslationLanguageRequest;
use App\Models\Conversation;
use App\Services\MessageTranslationService;
use Illuminate\Http\JsonResponse;

class ConversationTranslationController extends Controller
{
    public function __construct(private MessageTranslationService $translations) {}

    public function translateDraft(TranslateDraftRequest $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('sendMessage', $conversation);

        try {
            $translated = $this->translations->translateDraft(
                $conversation->tenant_id,
                $request->validated('content'),
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
                'translated_content' => $translated,
                'target_language' => $request->validated('target_language'),
            ],
        ]);
    }

    public function updateLanguage(
        UpdateTranslationLanguageRequest $request,
        Conversation $conversation,
    ): JsonResponse {
        $this->authorize('view', $conversation);

        $conversation->update([
            'contact_language' => $request->validated('contact_language'),
        ]);

        return response()->json([
            'data' => [
                'id' => $conversation->id,
                'contact_language' => $conversation->contact_language,
            ],
        ]);
    }
}
