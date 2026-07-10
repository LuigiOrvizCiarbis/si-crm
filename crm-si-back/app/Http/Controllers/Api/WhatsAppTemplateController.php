<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendTemplateRequest;
use App\Models\Channel;
use App\Models\Conversation;
use App\Models\WhatsAppTemplate;
use App\Services\WhatsAppTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
     * Subir un archivo a Meta para usarlo como header de plantilla
     * (documento/imagen/video). Devuelve el media id de Meta.
     */
    public function uploadMedia(Request $request, Channel $channel): JsonResponse
    {
        $waConfig = $channel->whatsappConfig;

        if (! $waConfig) {
            return response()->json(['message' => 'Este canal no tiene configuración de WhatsApp'], 404);
        }

        $request->validate([
            // Límites de Meta: documento 100MB, video 16MB, imagen 5MB.
            'file' => 'required|file|mimetypes:application/pdf,image/jpeg,image/png,video/mp4|max:102400',
        ]);

        try {
            $mediaId = $this->templateService->uploadMedia($waConfig, $request->file('file'));

            return response()->json(['media_id' => $mediaId], 201);
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
