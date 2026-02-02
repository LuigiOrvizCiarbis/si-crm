<?php

namespace App\Services;

use App\Models\Message;
use App\Models\Conversation;
use App\Models\Contact;
use App\Models\Channel;
use App\Models\PipelineStage;
use App\Enums\MessageDirection;
use App\Enums\SenderType;
use App\Models\WhatsAppConfig;
use Carbon\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class WhatsAppMessageService
{
    public function processIncomingMessage(array $webhookData): ?Message
    {

        try {
            $value = $webhookData['value'] ?? null;
            if (!is_array($value)) {
                Log::warning('Payload sin value válido');
                return null;
            }

            $messages = $value['messages'] ?? [];
            if (empty($messages)) {
                Log::info('Webhook sin messages, nada que procesar');
                return null;
            }

            $messageData = $messages[0];
            $contactData = $value['contacts'][0] ?? null;
            $metadata = $value['metadata'] ?? [];

            $phoneNumberId = $metadata['phone_number_id'] ?? null;
            if (!$phoneNumberId) {
                Log::warning('phone_number_id ausente en metadata');
                return null;
            }

            $whatsappConfig = WhatsAppConfig::with('channels')
                ->where('phone_number_id', $phoneNumberId)
                ->first();

            if (!$whatsappConfig || $whatsappConfig->channels->isEmpty()) {
                Log::warning('Canal no encontrado para phone_number_id: ' . $phoneNumberId);
                return null;
            }

            // Tomar el primer canal asociado a esta config
            $channel = $whatsappConfig->channels->first();
            $tenantId = $channel->tenant_id;

            // Contacto
            $contact = $this->findOrCreateContact($contactData, $messageData['from'] ?? '', $tenantId);

            // Conversación (usar el ID del canal)
            $conversation = $this->findOrCreateConversation($contact, $channel);

            // Crear el mensaje (tenant_id del canal)
            $deliveredAt = isset($messageData['timestamp'])
                ? Carbon::createFromTimestamp((int) $messageData['timestamp'])->setTimezone(config('app.timezone'))
                : now();

            return $this->createMessage([
                'tenant_id' => $tenantId,
                'conversation_id' => $conversation->id,
                'sender_type' => SenderType::CONTACT,
                'sender_id' => $contact->id,
                'content' => $this->extractMessageContent($messageData),
                'direction' => MessageDirection::INBOUND,
                'external_id' => $messageData['id'] ?? null,
                'delivered_at' => $deliveredAt,
            ]);
        } catch (\Exception $e) {
            Log::error('Error procesando mensaje de WhatsApp: ' . $e->getMessage(), [
                'exception' => $e->getTraceAsString()
            ]);
            return null;
        }
    }

    private function findOrCreateContact(?array $contactData, string $phoneNumber, ?int $tenantId): Contact
    {
        $name = 'Sin nombre';
        if ($contactData && isset($contactData['profile']['name'])) {
            $name = $contactData['profile']['name'];
        }

        return Contact::firstOrCreate(
            [
                'tenant_id' => $tenantId,
                'phone' => $phoneNumber
            ],
            [
                'name' => $name,
                'source' => 'whatsapp'
            ]
        );
    }

    private function findOrCreateConversation(Contact $contact, Channel $channel): Conversation
    {
        $conversation = Conversation::firstOrCreate(
            [
                'tenant_id'   => $channel->tenant_id,
                'contact_id'  => $contact->id,
                'channel_id'  => $channel->id,
            ],
            [
                'status' => 'open',
                'last_message_at' => now()
            ]
        );

        // Si es una conversación nueva sin stage, asignar el stage por defecto
        if (!$conversation->pipeline_stage_id) {
            $defaultStage = PipelineStage::where('tenant_id', $channel->tenant_id)
                ->where(function($query) {
                    $query->where('is_default', true)
                          ->orWhereNotNull('id');
                })
                ->orderByDesc('is_default')
                ->orderBy('sort_order', 'asc')
                ->first();

            if ($defaultStage) {
                $conversation->update(['pipeline_stage_id' => $defaultStage->id]);
            }
        }

        return $conversation;
    }

    private function extractMessageContent(array $messageData): string
    {
        $type = $messageData['type'] ?? 'unknown';
        return match ($type) {
            'text' => $messageData['text']['body'] ?? '',
            'image' => 'Imagen enviada',
            'document' => 'Documento enviado',
            'audio' => 'Audio enviado',
            'video' => 'Video enviado',
            'location' => 'Ubicación compartida',
            'contacts' => 'Contacto compartido',
            default => 'Mensaje multimedia',
        };
    }

    private function createMessage(array $messageData): Message
    {
        $message = Message::create($messageData);

        if (
            isset($messageData['content']) &&
            isset($messageData['conversation_id']) &&
            ($messageData['type'] ?? 'text') === 'text'
        ) {
            // Actualiza la conversación con el último mensaje de texto
            Conversation::where('id', $messageData['conversation_id'])
                ->update([
                    'last_message_at' => $message->created_at,
                    'last_message_content' => $messageData['content'],
                ]);
        }

        try {
            Redis::publish('conversation.' . $message->conversation_id, json_encode($message));
        } catch (\Exception $e) {
            // Loguear error pero no detener el flujo si Redis falla
            Log::error("Error publicando en Redis: " . $e->getMessage());
        }


        return $message;
    }

    public function sendTextMessageFromCRM(Conversation $conversation, string $content, $user): Message
    {
        $channel = $conversation->channel;
        $waConfig = $channel->whatsappConfig;
        $to = $conversation->contact->phone;
        $businessPhoneId = $waConfig->phone_number_id;
        $businessToken = Crypt::decryptString($waConfig->bussines_token);

        if (strpos($to, '549') === 0) {
            $to = '54' . substr($to, 3);
        }

        $response = Http::withToken($businessToken)
            ->post("https://graph.facebook.com/v21.0/{$businessPhoneId}/messages", [
                "messaging_product" => "whatsapp",
                "recipient_type" => "individual",
                "to" => $to,
                "type" => "text",
                "text" => [
                    "body" => $content,
                ],
            ]);

        if (!$response->successful()) {
            throw new \Exception("Error enviando mensaje a WhatsApp: " . $response->body());
        }

        $message = Message::create([
            'tenant_id' => $conversation->tenant_id,
            'conversation_id' => $conversation->id,
            'sender_type' => SenderType::USER,
            'sender_id' => $user->id,
            'content' => $content,
            'direction' => MessageDirection::OUTBOUND,
            'delivered_at' => now(),
            'type' => 'text',
        ]);

        // 4. Actualizar la conversación con el último mensaje de texto
        $conversation->update([
            'last_message_at' => $message->created_at,
            'last_message_content' => $content,
        ]);

        try {
            Redis::publish('conversation.' . $message->conversation_id, json_encode($message));
        } catch (\Exception $e) {
            Log::error("Error publicando en Redis (Outbound): " . $e->getMessage());
        }

        return $message;
    }
}
