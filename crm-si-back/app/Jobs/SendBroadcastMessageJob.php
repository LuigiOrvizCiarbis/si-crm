<?php

namespace App\Jobs;

use App\Models\Conversation;
use App\Models\User;
use App\Models\WhatsAppTemplate;
use App\Services\WhatsAppTemplateService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * Envía un mensaje de plantilla de WhatsApp a UNA conversación como parte
 * de una difusión. El endpoint bulk despacha un job por conversación con
 * delay escalonado para no exceder el throughput de Meta.
 *
 * - tries=1: nunca reintentar — Meta puede haber aceptado el mensaje aunque
 *   el job falle después, y las plantillas de marketing no deben reintentarse
 *   dentro de las 24h (error 131049).
 */
class SendBroadcastMessageJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 30;

    public function __construct(
        public int $conversationId,
        public int $templateId,
        public array $components,
        public int $senderId,
        public int $tenantId,
    ) {}

    public function handle(WhatsAppTemplateService $templateService): void
    {
        // El job corre sin usuario autenticado: TenantScope no filtra nada,
        // por eso withoutGlobalScopes + filtro manual por tenant en TODAS las cargas.
        $conversation = Conversation::withoutGlobalScopes()
            ->with(['channel.whatsappConfig', 'contact'])
            ->where('tenant_id', $this->tenantId)
            ->find($this->conversationId);

        $template = WhatsAppTemplate::withoutGlobalScopes()
            ->where('tenant_id', $this->tenantId)
            ->find($this->templateId);

        $sender = User::where('tenant_id', $this->tenantId)->find($this->senderId);

        if (! $conversation || ! $template || ! $sender) {
            Log::warning('SendBroadcastMessageJob: recurso no encontrado en el tenant', [
                'tenant_id' => $this->tenantId,
                'conversation_id' => $this->conversationId,
                'template_id' => $this->templateId,
                'sender_id' => $this->senderId,
            ]);

            return;
        }

        // Guarda de integridad: la plantilla debe seguir aprobada y pertenecer
        // al mismo número de WhatsApp que el canal de la conversación.
        $configId = $conversation->channel?->whatsappConfig?->id;

        if (! $template->status->isApproved() || $configId === null || $template->whatsapp_config_id !== $configId) {
            Log::warning('SendBroadcastMessageJob: plantilla no válida para el canal', [
                'tenant_id' => $this->tenantId,
                'conversation_id' => $this->conversationId,
                'template_id' => $this->templateId,
                'template_status' => $template->status->value,
                'template_config_id' => $template->whatsapp_config_id,
                'channel_config_id' => $configId,
            ]);

            return;
        }

        try {
            $templateService->sendTemplateMessage($conversation, $template, $this->components, $sender);
        } catch (\Throwable $e) {
            // Fallo aislado: no rompe el resto del lote de la difusión.
            Log::error('SendBroadcastMessageJob: error enviando plantilla', [
                'tenant_id' => $this->tenantId,
                'conversation_id' => $this->conversationId,
                'template_id' => $this->templateId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
