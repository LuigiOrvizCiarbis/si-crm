<?php

namespace App\Services;

use App\Enums\MessageDirection;
use App\Enums\SenderType;
use App\Enums\TemplateStatus;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Models\WhatsAppConfig;
use App\Models\WhatsAppTemplate;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class WhatsAppTemplateService
{
    private const GRAPH_VERSION = 'v21.0';

    /**
     * Sincronizar templates desde Meta Graph API.
     *
     * @return int Cantidad de templates sincronizados
     */
    public function syncTemplates(WhatsAppConfig $config, int $tenantId): int
    {
        $token = $config->getDecryptedToken();
        if (! $token) {
            throw new \RuntimeException('No se pudo desencriptar el token de WhatsApp');
        }

        $wabaId = $config->waba_id;

        $response = Http::withToken($token)
            ->get('https://graph.facebook.com/'.self::GRAPH_VERSION."/{$wabaId}/message_templates", [
                'fields' => 'id,name,language,status,category,components',
                'limit' => 250,
            ]);

        if (! $response->successful()) {
            Log::error('Error sincronizando templates de WhatsApp', [
                'waba_id' => $wabaId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('Error sincronizando templates: '.$response->body());
        }

        $templates = $response->json('data', []);
        $syncedExternalIds = [];
        $count = 0;

        foreach ($templates as $templateData) {
            $externalId = $templateData['id'];
            $syncedExternalIds[] = $externalId;

            WhatsAppTemplate::updateOrCreate(
                [
                    'whatsapp_config_id' => $config->id,
                    'external_id' => $externalId,
                    'language' => $templateData['language'],
                ],
                [
                    'tenant_id' => $tenantId,
                    'name' => $templateData['name'],
                    'category' => $templateData['category'],
                    'status' => $templateData['status'],
                    'components' => $templateData['components'] ?? [],
                    'synced_at' => now(),
                ]
            );

            $count++;
        }

        // Marcar como DISABLED los templates que ya no existen en Meta
        if (! empty($syncedExternalIds)) {
            WhatsAppTemplate::where('whatsapp_config_id', $config->id)
                ->whereNotIn('external_id', $syncedExternalIds)
                ->where('status', '!=', TemplateStatus::Disabled)
                ->update(['status' => TemplateStatus::Disabled]);
        }

        return $count;
    }

    /**
     * Enviar un mensaje de template de WhatsApp.
     */
    public function sendTemplateMessage(
        Conversation $conversation,
        WhatsAppTemplate $template,
        array $components,
        User $sender,
    ): Message {
        $channel = $conversation->channel;
        $waConfig = $channel->whatsappConfig;
        $to = $conversation->contact->phone;
        $businessPhoneId = $waConfig->phone_number_id;
        $businessToken = Crypt::decryptString($waConfig->bussines_token);

        // Normalización de teléfono argentino (mismo patrón que sendTextMessageFromCRM)
        if (strpos($to, '549') === 0) {
            $to = '54'.substr($to, 3);
        }

        $payload = [
            'messaging_product' => 'whatsapp',
            'to' => $to,
            'type' => 'template',
            'template' => [
                'name' => $template->name,
                'language' => [
                    'code' => $template->language,
                ],
                'components' => $components,
            ],
        ];

        $response = Http::withToken($businessToken)
            ->post('https://graph.facebook.com/'.self::GRAPH_VERSION."/{$businessPhoneId}/messages", $payload);

        if (! $response->successful()) {
            throw new \RuntimeException('Error enviando template de WhatsApp: '.$response->body());
        }

        // Generar resumen legible del template para el historial de chat
        $contentSummary = $this->buildContentSummary($template, $components);

        $message = Message::create([
            'tenant_id' => $conversation->tenant_id,
            'conversation_id' => $conversation->id,
            'sender_type' => SenderType::USER,
            'sender_id' => $sender->id,
            'content' => $contentSummary,
            'direction' => MessageDirection::OUTBOUND,
            'delivered_at' => now(),
        ]);

        $conversation->update([
            'last_message_at' => $message->created_at,
            'last_message_content' => $contentSummary,
        ]);

        try {
            Redis::publish('conversation.'.$message->conversation_id, json_encode($message));
        } catch (\Exception $e) {
            Log::error('Error publicando en Redis (Template): '.$e->getMessage());
        }

        return $message;
    }

    /**
     * Construir resumen legible del contenido del template.
     *
     * Intenta resolver el body text real del template reemplazando los
     * placeholders {{1}}, {{2}}, etc. con los parámetros enviados.
     * Si no hay body, cae al nombre del template como fallback.
     */
    private function buildContentSummary(WhatsAppTemplate $template, array $components): string
    {
        // Extraer parámetros del body desde los components enviados
        $bodyParams = [];
        foreach ($components as $component) {
            $type = strtolower($component['type'] ?? '');
            if ($type === 'body') {
                foreach ($component['parameters'] ?? [] as $param) {
                    $bodyParams[] = $param['text'] ?? $param['image']['link'] ?? $param['document']['link'] ?? '...';
                }
            }
        }

        // Buscar el body text del template guardado
        $bodyText = null;
        foreach ($template->components ?? [] as $comp) {
            $type = strtoupper($comp['type'] ?? '');
            if ($type === 'BODY' && ! empty($comp['text'])) {
                $bodyText = $comp['text'];
                break;
            }
        }

        // Si tenemos body text, reemplazar placeholders con los parámetros
        if ($bodyText) {
            foreach ($bodyParams as $i => $value) {
                $bodyText = str_replace('{{'.($i + 1).'}}', $value, $bodyText);
            }

            return "📋 {$template->name}\n{$bodyText}";
        }

        // Fallback: solo el nombre del template
        $summary = "📋 Template: {$template->name}";
        if (! empty($bodyParams)) {
            $summary .= ' ('.implode(', ', $bodyParams).')';
        }

        return $summary;
    }
}
