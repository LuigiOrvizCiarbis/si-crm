<?php

namespace App\Services;

use App\Enums\ChannelType;
use App\Models\Message;
use App\Models\Contact;
use App\Models\Channel;
use App\Models\PipelineStage;
use App\Enums\MessageDirection;
use App\Enums\SenderType;
use App\Models\Conversation;
use App\Models\User;
use App\Models\WhatsAppConfig;
use Carbon\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use App\Events\MessageDeleted;
use App\Events\MessageEdited;
use App\Events\MessageSent;
use App\Events\TenantMessageReceived;
use App\Enums\MessageType;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class WhatsAppMessageService
{
    private const GRAPH_VERSION = 'v21.0';

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

            $channel = $this->resolveChannelFromWebhook($value, 'processIncomingMessage');
            if (!$channel) {
                return null;
            }

            $messageData = $messages[0];
            $contactData = $value['contacts'][0] ?? null;
            $tenantId = $channel->tenant_id;
            $messageType = $messageData['type'] ?? 'unknown';
            $messageId = $messageData['id'] ?? null;

            Log::info('WhatsApp incoming message', [
                'type'        => $messageType,
                'id'          => $messageId,
                'keys'        => array_keys($messageData),
                'has_context' => isset($messageData['context']),
                'context'     => $messageData['context'] ?? null,
                'has_errors'  => isset($messageData['errors']),
                'errors'      => $messageData['errors'] ?? null,
                'tenant_id'   => $tenantId,
            ]);

            // Mensaje eliminado por el contacto desde su celular ("delete for everyone").
            // Meta envía type: "unsupported" con errors[].code = 131051. El id del
            // mensaje original viene en context.id (no en el id top-level, que es un id nuevo del evento).
            if ($this->isMessageDeletionEvent($messageData)) {
                $deletedId = $messageData['context']['id'] ?? $messageId;
                $this->handleIncomingMessageDeleted($deletedId, $tenantId);
                return null;
            }

            // Mensaje editado por el contacto desde su celular.
            // Meta puede enviarlo de varias formas: con context.edited: true, con un
            // top-level edit, o como un mensaje text cuyo context.id apunta a un
            // mensaje existente y además marca explícitamente la edición.
            $originalEditedId = $this->detectEditedMessageOriginalId($messageData, $tenantId);
            if ($originalEditedId) {
                return $this->handleIncomingMessageEdited($messageData, $originalEditedId, $tenantId);
            }

            // Si el tipo no está en la lista de tipos soportados, NO creamos un
            // "Mensaje multimedia" falso. Logueamos el payload completo para poder
            // iterar sobre nuevos formatos de Meta (edit/delete/reaction/etc).
            if (!$this->isSupportedMessageType($messageType)) {
                Log::warning('WhatsApp message type no soportado, payload ignorado', [
                    'type'         => $messageType,
                    'message_data' => $messageData,
                    'tenant_id'    => $tenantId,
                ]);
                return null;
            }

            $contact = $this->findOrCreateContact($contactData, $messageData['from'] ?? '', $tenantId);
            $conversation = $this->findOrCreateConversation($contact, $channel);

            $extracted = $this->extractMessageData($messageData);

            $mediaFields = [];
            if ($extracted['media_id'] && $extracted['type'] !== 'text') {
                $waConfig = $channel->whatsappConfig;
                if ($waConfig) {
                    $accessToken = Crypt::decryptString($waConfig->bussines_token);
                    $mediaFields = $this->downloadWhatsAppMedia(
                        $extracted['media_id'],
                        $accessToken,
                        $tenantId
                    );
                }
            }

            return $this->createMessage([
                'tenant_id' => $tenantId,
                'conversation_id' => $conversation->id,
                'sender_type' => SenderType::CONTACT,
                'sender_id' => $contact->id,
                'content' => $extracted['content'],
                'message_type' => $extracted['type'],
                'media_url' => $mediaFields['url'] ?? null,
                'media_mime_type' => $mediaFields['mime_type'] ?? null,
                'media_filename' => $mediaFields['filename'] ?? null,
                'direction' => MessageDirection::INBOUND,
                'external_id' => $messageData['id'] ?? null,
                'delivered_at' => $this->parseWebhookTimestamp($messageData['timestamp'] ?? null),
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

    private function resolveChannelFromWebhook(array $value, string $context): ?Channel
    {
        $phoneNumberId = $value['metadata']['phone_number_id'] ?? null;

        if (!$phoneNumberId) {
            Log::warning("{$context}: phone_number_id ausente en metadata");
            return null;
        }

        $whatsappConfig = WhatsAppConfig::with('channels')
            ->where('phone_number_id', $phoneNumberId)
            ->first();

        if (!$whatsappConfig || $whatsappConfig->channels->isEmpty()) {
            Log::warning("{$context}: canal no encontrado para phone_number_id: {$phoneNumberId}");
            return null;
        }

        return $whatsappConfig->channels->first();
    }

    private function parseWebhookTimestamp(?string $timestamp): Carbon
    {
        if ($timestamp) {
            return Carbon::createFromTimestamp((int) $timestamp)->setTimezone(config('app.timezone'));
        }

        return Carbon::now();
    }

    public function sendImageMessageFromCRM(
        Conversation $conversation,
        string $localMediaPath,
        string $mediaUrl,
        string $mimeType,
        ?string $caption,
        User $user
    ): Message {
        ['to' => $to, 'business_phone_id' => $businessPhoneId, 'business_token' => $businessToken] =
            $this->resolveOutboundWhatsAppContext($conversation);

        $uploadResponse = Http::withToken($businessToken)
            ->attach('file', Storage::disk('public')->get($localMediaPath), basename($localMediaPath), ['Content-Type' => $mimeType])
            ->post("https://graph.facebook.com/".self::GRAPH_VERSION."/{$businessPhoneId}/media", [
                'messaging_product' => 'whatsapp',
                'type' => $mimeType,
            ]);

        if (! $uploadResponse->successful()) {
            throw new \RuntimeException('Error subiendo imagen a WhatsApp: ' . $uploadResponse->body());
        }

        $whatsappMediaId = $uploadResponse->json('id');


        $messagePayload = [
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $to,
            'type' => 'image',
            'image' => [
                'id' => $whatsappMediaId,
            ],
        ];

        if ($caption) {
            $messagePayload['image']['caption'] = $caption;
        }

        $sendResponse = Http::withToken($businessToken)
            ->post("https://graph.facebook.com/".self::GRAPH_VERSION."/{$businessPhoneId}/messages", $messagePayload);

        if (! $sendResponse->successful()) {
            throw new \RuntimeException('Error enviando imagen por WhatsApp: ' . $sendResponse->body());
        }

        $externalId = $sendResponse->json('messages.0.id');

        $message = Message::create([
            'tenant_id' => $conversation->tenant_id,
            'conversation_id' => $conversation->id,
            'sender_type' => SenderType::USER,
            'sender_id' => $user->id,
            'content' => $caption ?? '',
            'message_type' => MessageType::Image,
            'media_url' => $mediaUrl,
            'media_mime_type' => $mimeType,
            'media_filename' => basename($localMediaPath),
            'direction' => MessageDirection::OUTBOUND,
            'delivered_at' => now(),
            'external_id' => $externalId,
        ]);

        $conversation->update([
            'last_message_at' => $message->created_at,
            'last_message_content' => '📷 ' . ($caption ?: 'Imagen'),
        ]);

        try {
            broadcast(new MessageSent($message));
            broadcast(new TenantMessageReceived($message, $conversation->tenant_id));
        } catch (\Exception $e) {
            Log::error("Error broadcasting outbound image message: " . $e->getMessage());
        }

        return $message;
    }

    public function sendAudioMessageFromCRM(
        Conversation $conversation,
        string $localMediaPath,
        string $mediaUrl,
        string $mimeType,
        User $user
    ): Message {
        ['to' => $to, 'business_phone_id' => $businessPhoneId, 'business_token' => $businessToken] =
            $this->resolveOutboundWhatsAppContext($conversation);

        $uploadResponse = Http::withToken($businessToken)
            ->attach('file', Storage::disk('public')->get($localMediaPath), basename($localMediaPath), ['Content-Type' => $mimeType])
            ->post("https://graph.facebook.com/".self::GRAPH_VERSION."/{$businessPhoneId}/media", [
                'messaging_product' => 'whatsapp',
                'type' => $mimeType,
            ]);

        if (! $uploadResponse->successful()) {
            throw new \RuntimeException('Error subiendo audio a WhatsApp: ' . $uploadResponse->body());
        }

        $whatsappMediaId = $uploadResponse->json('id');

        $sendResponse = Http::withToken($businessToken)
            ->post("https://graph.facebook.com/".self::GRAPH_VERSION."/{$businessPhoneId}/messages", [
                'messaging_product' => 'whatsapp',
                'recipient_type' => 'individual',
                'to' => $to,
                'type' => 'audio',
                'audio' => [
                    'id' => $whatsappMediaId,
                ],
            ]);

        if (! $sendResponse->successful()) {
            throw new \RuntimeException('Error enviando audio por WhatsApp: ' . $sendResponse->body());
        }

        $externalId = $sendResponse->json('messages.0.id');

        $message = Message::create([
            'tenant_id' => $conversation->tenant_id,
            'conversation_id' => $conversation->id,
            'sender_type' => SenderType::USER,
            'sender_id' => $user->id,
            'content' => '',
            'message_type' => MessageType::Audio,
            'media_url' => $mediaUrl,
            'media_mime_type' => $mimeType,
            'media_filename' => basename($localMediaPath),
            'direction' => MessageDirection::OUTBOUND,
            'delivered_at' => now(),
            'external_id' => $externalId,
        ]);

        $conversation->update([
            'last_message_at' => $message->created_at,
            'last_message_content' => '🎵 Audio',
        ]);

        try {
            broadcast(new MessageSent($message));
            broadcast(new TenantMessageReceived($message, $conversation->tenant_id));
        } catch (\Exception $e) {
            Log::error("Error broadcasting outbound audio message: " . $e->getMessage());
        }

        return $message;
    }

    /**
     * Lista de tipos de mensajes soportados por el CRM. Cualquier otro tipo
     * (reaction, unsupported, system, etc.) debe ser manejado explícitamente
     * o ignorado; no fabricar un "Mensaje multimedia" falso.
     */
    private function isSupportedMessageType(string $type): bool
    {
        return in_array($type, [
            'text',
            'image',
            'sticker',
            'document',
            'audio',
            'video',
            'location',
            'contacts',
        ], true);
    }

    /**
     * Detecta si un webhook entrante representa la eliminación de un mensaje
     * por parte del contacto desde su celular ("delete for everyone").
     *
     * Meta lo envía como type: "unsupported" con errors[].code = 131051.
     * El id del mensaje original viene típicamente en context.id.
     */
    private function isMessageDeletionEvent(array $messageData): bool
    {
        if (($messageData['type'] ?? null) !== 'unsupported') {
            return false;
        }

        $errors = $messageData['errors'] ?? [];
        if (!is_array($errors)) {
            return true;
        }

        foreach ($errors as $error) {
            $code = $error['code'] ?? null;
            if ($code === 131051 || $code === '131051') {
                return true;
            }
        }

        // Si llega type=unsupported sin errors, igual asumimos delete para no
        // crear un mensaje fantasma.
        return true;
    }

    /**
     * Detecta el id original de un mensaje editado por el contacto desde su celular.
     * Devuelve null si el mensaje no parece ser una edición.
     *
     * Meta puede enviarlo con varias formas. Soportamos:
     *   1) context.edited === true (formato histórico)
     *   2) messages[].edited === true con original id en context.id
     *   3) Mensaje text con context.id que apunta a un mensaje INBOUND ya
     *      existente en el CRM y con campo context.from == from (no es reply)
     */
    private function detectEditedMessageOriginalId(array $messageData, int $tenantId): ?string
    {
        $context = $messageData['context'] ?? [];
        $originalId = $context['id'] ?? null;

        if (!empty($context['edited']) && $originalId) {
            return $originalId;
        }

        if (!empty($messageData['edited']) && $originalId) {
            return $originalId;
        }

        // Último recurso: si llega un mensaje de texto con context.id apuntando
        // a un mensaje INBOUND existente del mismo remitente, es casi seguro una
        // edición (replies suelen venir con context.from distinto del id real del
        // mensaje referenciado, y Meta no genera "replies a sí mismo").
        if (($messageData['type'] ?? null) === 'text' && $originalId) {
            $from = $messageData['from'] ?? null;
            $contextFrom = $context['from'] ?? null;

            if ($from && $contextFrom && $from === $contextFrom) {
                $existing = Message::where('tenant_id', $tenantId)
                    ->where('external_id', $originalId)
                    ->where('direction', MessageDirection::INBOUND)
                    ->exists();

                if ($existing) {
                    return $originalId;
                }
            }
        }

        return null;
    }

    /**
     * @return array{content: string, type: string, media_id: string|null}
     */
    private function extractMessageData(array $messageData): array
    {
        $type = $messageData['type'] ?? 'unknown';

        $content = match ($type) {
            'text' => $messageData['text']['body'] ?? '',
            'image' => $messageData['image']['caption'] ?? '',
            'sticker' => '',
            'document' => $messageData['document']['filename'] ?? 'Documento',
            'audio' => '',
            'video' => $messageData['video']['caption'] ?? '',
            'location' => 'Ubicación compartida',
            'contacts' => 'Contacto compartido',
            default => '',
        };

        $mediaId = match ($type) {
            'image' => $messageData['image']['id'] ?? null,
            'sticker' => $messageData['sticker']['id'] ?? null,
            'document' => $messageData['document']['id'] ?? null,
            'audio' => $messageData['audio']['id'] ?? null,
            'video' => $messageData['video']['id'] ?? null,
            default => null,
        };

        $mappedType = match ($type) {
            'text' => 'text',
            'image' => 'image',
            'sticker' => 'sticker',
            'document' => 'document',
            'audio' => 'audio',
            'video' => 'video',
            default => 'text',
        };

        return [
            'content' => $content,
            'type' => $mappedType,
            'media_id' => $mediaId,
        ];
    }

    /**
     * @return array{url: string, mime_type: string, filename: string}
     */
    private function downloadWhatsAppMedia(string $mediaId, string $accessToken, int $tenantId): array
    {

        $metaResponse = Http::withToken($accessToken)
            ->get("https://graph.facebook.com/v21.0/{$mediaId}");

        if (! $metaResponse->successful()) {
            Log::error("Error obteniendo URL de media WhatsApp: {$metaResponse->body()}");

            return ['url' => '', 'mime_type' => '', 'filename' => ''];
        }

        $mediaUrl = $metaResponse->json('url');
        $mimeType = $metaResponse->json('mime_type', 'application/octet-stream');


        $fileResponse = Http::withToken($accessToken)->get($mediaUrl);

        if (! $fileResponse->successful()) {
            Log::error("Error descargando media de WhatsApp: {$fileResponse->status()}");

            return ['url' => '', 'mime_type' => '', 'filename' => ''];
        }


        $extension = $this->mimeToExtension($mimeType);
        $filename = uniqid('wa_') . '.' . $extension;
        $path = "messages/{$tenantId}/{$filename}";

        Storage::disk('public')->put($path, $fileResponse->body());

        return [
            'url' => '/storage/' . $path,
            'mime_type' => $mimeType,
            'filename' => $filename,
        ];
    }

    private function normalizePhoneForWhatsApp(string $phone): string
    {
        if (strpos($phone, '549') === 0) {
            return '54' . substr($phone, 3);
        }

        return $phone;
    }

    /**
     * @return array{to: string, business_phone_id: string, business_token: string}
     */
    private function resolveOutboundWhatsAppContext(Conversation $conversation): array
    {
        $channel = $conversation->channel;
        if (! $channel) {
            throw new \InvalidArgumentException('La conversación no tiene un canal asociado.');
        }

        if ($channel->type !== ChannelType::WHATSAPP) {
            throw new \InvalidArgumentException('Solo se pueden enviar mensajes desde conversaciones de WhatsApp.');
        }

        if (! $channel->isActive()) {
            throw new \InvalidArgumentException('El canal de WhatsApp está desconectado.');
        }

        $waConfig = $channel->whatsappConfig;
        if (! $waConfig || ! $waConfig->phone_number_id) {
            throw new \InvalidArgumentException('El canal no tiene una configuración válida de WhatsApp.');
        }

        $businessToken = $waConfig->getDecryptedToken();
        if (! $businessToken) {
            throw new \InvalidArgumentException('No se pudo obtener el token de WhatsApp del canal.');
        }

        $phone = $conversation->contact?->phone;
        if (! $phone) {
            throw new \InvalidArgumentException('La conversación no tiene un teléfono de contacto válido.');
        }

        return [
            'to' => $this->normalizePhoneForWhatsApp($phone),
            'business_phone_id' => $waConfig->phone_number_id,
            'business_token' => $businessToken,
        ];
    }

    private function mimeToExtension(string $mimeType): string
    {
        return match ($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            'video/mp4' => 'mp4',
            'video/3gpp' => '3gp',
            'audio/aac' => 'aac',
            'audio/ogg' => 'ogg',
            'audio/mpeg' => 'mp3',
            'application/pdf' => 'pdf',
            default => 'bin',
        };
    }

    private function createMessage(array $messageData): Message
    {
        $message = Message::create($messageData);

        if (isset($messageData['conversation_id'])) {
            $type = $messageData['message_type'] ?? 'text';
            $lastContent = match ($type) {
                'image' => '📷 ' . ($messageData['content'] ?: 'Imagen'),
                'sticker' => '🏷️ Sticker',
                'video' => '🎥 ' . ($messageData['content'] ?: 'Video'),
                'audio' => '🎵 Audio',
                'document' => '📄 ' . ($messageData['content'] ?: 'Documento'),
                default => $messageData['content'] ?? '',
            };

            Conversation::where('id', $messageData['conversation_id'])
                ->update([
                    'last_message_at' => $message->created_at,
                    'last_message_content' => $lastContent,
                ]);
        }

        try {
            broadcast(new MessageSent($message));
            broadcast(new TenantMessageReceived($message, $messageData['tenant_id']));
        } catch (\Exception $e) {
            Log::error("Error broadcasting message: " . $e->getMessage());
        }

        return $message;
    }

    /**
     * Procesa el webhook smb_app_state_sync (coexistencia).
     * Sincroniza los contactos del WhatsApp Business App al CRM.
     *
     * Actions soportadas (normalizadas a lowercase):
     *   upsert  → add, added, edit, edited, update, updated
     *   remove lógico (no se borra del CRM para preservar historial)
     *           → remove, removed, delete, deleted
     *
     * @see https://developers.facebook.com/docs/whatsapp/embedded-signup/onboarding-business-app-users
     */
    public function processSmbAppStateSync(array $changeValue, int $tenantId): void
    {
        $stateSync = $changeValue['state_sync'] ?? [];

        // Acciones que significan crear/actualizar el contacto en el CRM.
        $upsertActions = ['add', 'added', 'edit', 'edited', 'update', 'updated'];

        // Acciones que significan que el contacto fue eliminado de la agenda.
        // No borramos el registro para preservar historial de conversaciones.
        $removeActions = ['remove', 'removed', 'delete', 'deleted'];

        foreach ($stateSync as $syncItem) {
            if (($syncItem['type'] ?? '') !== 'contact') {
                continue;
            }

            $contactData = $syncItem['contact'] ?? [];
            $action      = strtolower(trim($syncItem['action'] ?? 'add'));
            $phoneNumber = $contactData['phone_number'] ?? null;
            $bsuid       = $contactData['user_id'] ?? null;
            $fullName    = $contactData['full_name'] ?? $contactData['first_name'] ?? 'Sin nombre';

            if (!$phoneNumber && !$bsuid) {
                Log::warning('smb_app_state_sync: contacto sin phone_number ni user_id, ignorado', [
                    'action' => $action,
                ]);
                continue;
            }

            if (in_array($action, $upsertActions, true)) {
                if ($phoneNumber) {
                    // Anti-duplicado: si antes llegó el mismo contacto sin phone (keyed por
                    // external_id/BSUID) y ahora llega con phone, actualizamos ese registro
                    // en vez de crear uno nuevo.
                    if ($bsuid) {
                        $existingByBsuid = Contact::where('tenant_id', $tenantId)
                            ->where('external_id', $bsuid)
                            ->whereNull('phone')
                            ->first();

                        if ($existingByBsuid) {
                            $existingByBsuid->update([
                                'phone' => $phoneNumber,
                                'name'  => $fullName,
                            ]);
                            continue;
                        }
                    }

                    Contact::updateOrCreate(
                        ['tenant_id' => $tenantId, 'phone' => $phoneNumber],
                        ['name' => $fullName, 'external_id' => $bsuid, 'source' => 'whatsapp']
                    );
                } else {
                    // Sin phone_number (username activado o sin mensajes recientes).
                    // Anti-duplicado: si ya existe por external_id, actualizamos ese registro
                    // en vez de crear uno nuevo.
                    $existingByBsuid = Contact::where('tenant_id', $tenantId)
                        ->where('external_id', $bsuid)
                        ->first();

                    if ($existingByBsuid) {
                        $existingByBsuid->update(['name' => $fullName]);
                        continue;
                    }

                    Contact::updateOrCreate(
                        ['tenant_id' => $tenantId, 'external_id' => $bsuid],
                        ['name' => $fullName, 'source' => 'whatsapp']
                    );
                }
            } elseif (in_array($action, $removeActions, true)) {
                // Preservamos el contacto y su historial; solo lo logueamos.
                Log::info('smb_app_state_sync: contacto removido de WA Business App (no se elimina del CRM)', [
                    'tenant_id'   => $tenantId,
                    'phone'       => $phoneNumber,
                    'external_id' => $bsuid,
                    'name'        => $fullName,
                ]);
            } else {
                Log::warning('smb_app_state_sync: action desconocida ignorada', [
                    'action'      => $action,
                    'phone'       => $phoneNumber,
                    'external_id' => $bsuid,
                ]);
            }
        }
    }

    /**
     * Procesa mensajes enviados desde la app de WhatsApp Business (coexistencia).
     * Estos llegan como smb_message_echoes y son mensajes OUTBOUND que el negocio
     * envió desde la app, no desde el CRM.
     */
    public function processSmbMessageEchoes(array $webhookData): void
    {
        $value = $webhookData['value'] ?? null;
        if (!is_array($value)) {
            return;
        }

        $echoes = $value['message_echoes'] ?? [];
        if (empty($echoes)) {
            return;
        }

        $channel = $this->resolveChannelFromWebhook($value, 'smb_message_echoes');
        if (!$channel) {
            return;
        }

        $tenantId = $channel->tenant_id;

        foreach ($echoes as $echo) {
            $customerPhone = $echo['to'] ?? null;
            if (!$customerPhone) {
                continue;
            }

            $externalId = $echo['id'] ?? null;
            if ($externalId && Message::where('tenant_id', $tenantId)->where('external_id', $externalId)->exists()) {
                continue;
            }

            $echoType = $echo['type'] ?? 'unknown';
            if (!$this->isSupportedMessageType($echoType)) {
                Log::warning('smb_message_echoes: tipo no soportado, echo ignorado', [
                    'type'      => $echoType,
                    'echo'      => $echo,
                    'tenant_id' => $tenantId,
                ]);
                continue;
            }

            $contact = $this->findOrCreateContact(null, $customerPhone, $tenantId);
            $conversation = $this->findOrCreateConversation($contact, $channel);

            $extracted = $this->extractMessageData($echo);
            $mediaFields = [];
            if ($extracted['media_id'] && $extracted['type'] !== 'text') {
                $waConfig = $channel->whatsappConfig;
                if ($waConfig) {
                    $accessToken = Crypt::decryptString($waConfig->bussines_token);
                    $mediaFields = $this->downloadWhatsAppMedia(
                        $extracted['media_id'],
                        $accessToken,
                        $tenantId
                    );
                }
            }

            $this->createMessage([
                'tenant_id' => $tenantId,
                'conversation_id' => $conversation->id,
                'sender_type' => SenderType::USER,
                'sender_id' => $channel->user_id,
                'content' => $extracted['content'],
                'message_type' => $extracted['type'],
                'media_url' => $mediaFields['url'] ?? null,
                'media_mime_type' => $mediaFields['mime_type'] ?? null,
                'media_filename' => $mediaFields['filename'] ?? null,
                'direction' => MessageDirection::OUTBOUND,
                'external_id' => $externalId,
                'delivered_at' => $this->parseWebhookTimestamp($echo['timestamp'] ?? null),
            ]);
        }
    }

    public function sendTextMessageFromCRM(Conversation $conversation, string $content, User $user): Message
    {
        ['to' => $to, 'business_phone_id' => $businessPhoneId, 'business_token' => $businessToken] =
            $this->resolveOutboundWhatsAppContext($conversation);

        $response = Http::withToken($businessToken)
            ->post("https://graph.facebook.com/".self::GRAPH_VERSION."/{$businessPhoneId}/messages", [
                'messaging_product' => 'whatsapp',
                'recipient_type' => 'individual',
                'to' => $to,
                'type' => 'text',
                'text' => [
                    'body' => $content,
                ],
            ]);

        if (! $response->successful()) {
            throw new \RuntimeException('Error enviando mensaje a WhatsApp: ' . $response->body());
        }

        $externalId = $response->json('messages.0.id');

        $message = Message::create([
            'tenant_id' => $conversation->tenant_id,
            'conversation_id' => $conversation->id,
            'sender_type' => SenderType::USER,
            'sender_id' => $user->id,
            'content' => $content,
            'direction' => MessageDirection::OUTBOUND,
            'delivered_at' => now(),
            'message_type' => MessageType::Text,
            'external_id' => $externalId,
        ]);

        $conversation->update([
            'last_message_at' => $message->created_at,
            'last_message_content' => $content,
        ]);

        try {
            broadcast(new MessageSent($message));
            broadcast(new TenantMessageReceived($message, $conversation->tenant_id));
        } catch (\Exception $e) {
            Log::error("Error broadcasting outbound message: " . $e->getMessage());
        }

        return $message;
    }

    /**
     * Procesa la eliminación de un mensaje enviada desde el celular del contacto
     * ("delete for everyone"). Soft-elimina el mensaje en el CRM y notifica por SSE.
     */
    private function handleIncomingMessageDeleted(?string $externalId, int $tenantId): void
    {
        if (!$externalId) {
            return;
        }

        $message = Message::withTrashed()
            ->where('tenant_id', $tenantId)
            ->where('external_id', $externalId)
            ->first();

        if (!$message) {
            Log::info('handleIncomingMessageDeleted: mensaje no encontrado en CRM', [
                'external_id' => $externalId,
                'tenant_id'   => $tenantId,
            ]);
            return;
        }

        // Idempotencia: si Meta reenvía el evento, no volvemos a borrar ni broadcastear.
        if ($message->trashed()) {
            return;
        }

        $conversation = $message->conversation;
        $conversationId = $message->conversation_id;
        $message->delete();

        $conversation?->syncLastMessageSummary();

        try {
            broadcast(new MessageDeleted($message, $conversationId));
            broadcast(new TenantMessageReceived($message, $tenantId));
        } catch (\Exception $e) {
            Log::error('Error broadcasting message deleted from webhook: ' . $e->getMessage());
        }
    }

    /**
     * Procesa la edición de un mensaje enviada desde el celular del contacto.
     * Actualiza el contenido del mensaje original en el CRM y notifica por SSE.
     */
    private function handleIncomingMessageEdited(array $messageData, string $originalExternalId, int $tenantId): ?Message
    {
        $existingMessage = Message::where('tenant_id', $tenantId)
            ->where('external_id', $originalExternalId)
            ->first();

        if (!$existingMessage) {
            Log::info('handleIncomingMessageEdited: mensaje original no encontrado en CRM', [
                'original_external_id' => $originalExternalId,
                'tenant_id'            => $tenantId,
            ]);
            return null;
        }

        $extracted = $this->extractMessageData($messageData);

        $existingMessage->update([
            'original_content' => $existingMessage->original_content ?? $existingMessage->content,
            'content'          => $extracted['content'],
            'edited_at'        => now(),
        ]);

        $freshMessage = $existingMessage->fresh();

        $freshMessage?->conversation?->syncLastMessageSummary();

        try {
            broadcast(new MessageEdited($freshMessage));
            broadcast(new TenantMessageReceived($freshMessage, $tenantId));
        } catch (\Exception $e) {
            Log::error('Error broadcasting message edited from webhook: ' . $e->getMessage());
        }

        return $freshMessage;
    }
}
