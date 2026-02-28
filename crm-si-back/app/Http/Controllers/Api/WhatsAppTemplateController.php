<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendTemplateRequest;
use App\Models\Channel;
use App\Models\Conversation;
use App\Models\WhatsAppTemplate;
use App\Services\WhatsAppTemplateService;
use Illuminate\Http\JsonResponse;

class WhatsAppTemplateController extends Controller
{
    public function __construct(
        public WhatsAppTemplateService $templateService,
    ) {}

    /**
     * Listar templates aprobados de un canal.
     */
    public function index(Channel $channel): JsonResponse
    {
        $waConfig = $channel->whatsappConfig;

        if (! $waConfig) {
            return response()->json(['message' => 'Este canal no tiene configuración de WhatsApp'], 404);
        }

        $templates = WhatsAppTemplate::where('whatsapp_config_id', $waConfig->id)
            ->approved()
            ->orderBy('name')
            ->get();

        return response()->json($templates);
    }

    /**
     * Sincronizar templates desde Meta.
     */
    public function sync(Channel $channel): JsonResponse
    {
        $waConfig = $channel->whatsappConfig;

        if (! $waConfig) {
            return response()->json(['message' => 'Este canal no tiene configuración de WhatsApp'], 404);
        }

        try {
            $count = $this->templateService->syncTemplates($waConfig, $channel->tenant_id);

            return response()->json([
                'message' => "Se sincronizaron {$count} templates",
                'count' => $count,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Enviar un mensaje de template.
     */
    public function send(SendTemplateRequest $request, Conversation $conversation): JsonResponse
    {
        $template = WhatsAppTemplate::findOrFail($request->validated('template_id'));

        if (! $template->status->isApproved()) {
            return response()->json(['message' => 'El template no está aprobado'], 422);
        }

        try {
            $message = $this->templateService->sendTemplateMessage(
                $conversation,
                $template,
                $request->validated('components', []),
                $request->user(),
            );

            return response()->json($message, 201);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}
