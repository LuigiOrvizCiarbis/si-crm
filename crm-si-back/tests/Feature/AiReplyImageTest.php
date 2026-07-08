<?php

namespace Tests\Feature;

use App\Enums\ChannelType;
use App\Enums\MessageDirection;
use App\Enums\MessageType;
use App\Enums\SenderType;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Tenant;
use App\Models\User;
use App\Services\AiReplyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use ReflectionMethod;
use Tests\TestCase;

/**
 * Cubre el soporte multimodal de imágenes en el historial que arma
 * AiReplyService para el auto-responder. buildHistory es privado: se ejercita
 * por reflexión para verificar el formato de bloques que viaja al proveedor.
 */
class AiReplyImageTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Invoca AiReplyService::buildHistory (privado) sobre la conversación.
     *
     * @return array<int, array{role: string, content: string|array<int, array<string, mixed>>}>
     */
    private function buildHistory(Conversation $conversation, bool $allowImages = true): array
    {
        $method = new ReflectionMethod(AiReplyService::class, 'buildHistory');
        $method->setAccessible(true);

        return $method->invoke(app(AiReplyService::class), $conversation, $allowImages);
    }

    private function makeConversation(): Conversation
    {
        $tenant = Tenant::create(['name' => 'Acme '.uniqid()]);

        $user = User::factory()->create(['tenant_id' => $tenant->id]);

        $channel = Channel::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'type' => ChannelType::WHATSAPP,
            'name' => 'Main channel',
            'status' => 'active',
        ]);

        $contact = Contact::create([
            'tenant_id' => $tenant->id,
            'name' => 'Jane Doe',
            'phone' => '+5491111111111',
            'source' => 'whatsapp',
        ]);

        return Conversation::create([
            'tenant_id' => $tenant->id,
            'channel_id' => $channel->id,
            'contact_id' => $contact->id,
            'status' => 'open',
        ]);
    }

    private function addMessage(
        Conversation $conversation,
        MessageType $type,
        MessageDirection $direction,
        string $content = '',
        ?string $mediaUrl = null,
        ?string $mediaMime = null,
    ): Message {
        return Message::create([
            'tenant_id' => $conversation->tenant_id,
            'conversation_id' => $conversation->id,
            'sender_type' => $direction === MessageDirection::INBOUND ? SenderType::CONTACT : SenderType::SYSTEM,
            'content' => $content,
            'message_type' => $type,
            'media_url' => $mediaUrl,
            'media_mime_type' => $mediaMime,
            'direction' => $direction,
        ]);
    }

    /**
     * Guarda un PNG mínimo válido en el disco público y devuelve su media_url.
     */
    private function storeImage(Conversation $conversation): string
    {
        $binary = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        );
        $path = "messages/{$conversation->tenant_id}/test.png";
        Storage::disk('public')->put($path, $binary);

        return '/storage/'.$path;
    }

    public function test_inbound_image_becomes_visual_block(): void
    {
        Storage::fake('public');

        $conversation = $this->makeConversation();
        $mediaUrl = $this->storeImage($conversation);
        $this->addMessage($conversation, MessageType::Image, MessageDirection::INBOUND, 'Mirá esto', $mediaUrl, 'image/png');

        $history = $this->buildHistory($conversation);

        $this->assertCount(1, $history);
        $this->assertSame('user', $history[0]['role']);
        $this->assertIsArray($history[0]['content']);

        $image = $history[0]['content'][0];
        $this->assertSame('image', $image['type']);
        $this->assertSame('image/png', $image['mime']);
        $this->assertNotEmpty($image['data']);

        $text = $history[0]['content'][1];
        $this->assertSame('text', $text['type']);
        $this->assertSame('Mirá esto', $text['text']);
    }

    public function test_text_only_model_degrades_image_to_placeholder(): void
    {
        Storage::fake('public');

        $conversation = $this->makeConversation();
        $mediaUrl = $this->storeImage($conversation);
        $this->addMessage($conversation, MessageType::Image, MessageDirection::INBOUND, 'Mirá esto', $mediaUrl, 'image/png');

        // allowImages=false simula un modelo sin visión (gpt-3.5, claude-2): la
        // imagen NO debe viajar como bloque visual, sino como texto.
        $history = $this->buildHistory($conversation, allowImages: false);

        $this->assertIsString($history[0]['content']);
        $this->assertStringContainsString('[El cliente envió una imagen]', $history[0]['content']);
        $this->assertStringContainsString('Mirá esto', $history[0]['content']);
    }

    public function test_outbound_image_never_becomes_visual_block(): void
    {
        Storage::fake('public');

        $conversation = $this->makeConversation();
        $mediaUrl = $this->storeImage($conversation);

        // El cliente escribe, un humano/bot responde con una imagen (OUTBOUND) y
        // el cliente vuelve a escribir. La imagen saliente NO puede viajar como
        // bloque visual: los bloques de imagen son user-content y en un turno
        // assistant harían fallar la API. (El primer INBOUND evita que el turno
        // assistant inicial se recorte por la regla "empezar con user".)
        $this->addMessage($conversation, MessageType::Text, MessageDirection::INBOUND, 'Hola');
        $this->addMessage($conversation, MessageType::Image, MessageDirection::OUTBOUND, 'Te paso la foto', $mediaUrl, 'image/png');
        $this->addMessage($conversation, MessageType::Text, MessageDirection::INBOUND, 'Gracias');

        $history = $this->buildHistory($conversation);

        // Turno assistant (la imagen saliente): placeholder de texto, no bloque.
        $this->assertSame('assistant', $history[1]['role']);
        $this->assertIsString($history[1]['content']);
        $this->assertStringContainsString('[Se envió una imagen al cliente]', $history[1]['content']);
        $this->assertStringContainsString('Te paso la foto', $history[1]['content']);

        // Ningún turno debe contener bloques de imagen.
        foreach ($history as $entry) {
            if (is_array($entry['content'])) {
                foreach ($entry['content'] as $block) {
                    $this->assertNotSame('image', $block['type'] ?? null);
                }
            }
        }
    }

    public function test_image_without_caption_is_only_image_block(): void
    {
        Storage::fake('public');

        $conversation = $this->makeConversation();
        $mediaUrl = $this->storeImage($conversation);
        $this->addMessage($conversation, MessageType::Image, MessageDirection::INBOUND, '', $mediaUrl, 'image/png');

        $history = $this->buildHistory($conversation);

        $this->assertCount(1, $history[0]['content']);
        $this->assertSame('image', $history[0]['content'][0]['type']);
    }

    public function test_missing_file_degrades_to_text_placeholder(): void
    {
        Storage::fake('public');

        $conversation = $this->makeConversation();
        // media_url apunta a un archivo que no existe en el disco fake.
        $this->addMessage(
            $conversation,
            MessageType::Image,
            MessageDirection::INBOUND,
            'con caption',
            '/storage/messages/999/nope.png',
            'image/png',
        );

        $history = $this->buildHistory($conversation);

        $this->assertIsString($history[0]['content']);
        $this->assertStringContainsString('[El cliente envió una imagen]', $history[0]['content']);
        $this->assertStringContainsString('con caption', $history[0]['content']);
    }

    public function test_unsupported_mime_degrades_to_placeholder(): void
    {
        Storage::fake('public');

        $conversation = $this->makeConversation();
        $mediaUrl = $this->storeImage($conversation);
        // El archivo existe pero el mime no es de imagen soportada.
        $this->addMessage($conversation, MessageType::Image, MessageDirection::INBOUND, '', $mediaUrl, 'application/pdf');

        $history = $this->buildHistory($conversation);

        $this->assertIsString($history[0]['content']);
        $this->assertStringContainsString('[El cliente envió una imagen]', $history[0]['content']);
    }

    public function test_only_last_n_images_are_visual(): void
    {
        Storage::fake('public');
        config(['services.ai.max_images' => 1]);

        $conversation = $this->makeConversation();
        $mediaUrl = $this->storeImage($conversation);

        // Dos imágenes; solo la más reciente debe ir como bloque visual.
        $this->addMessage($conversation, MessageType::Image, MessageDirection::INBOUND, '', $mediaUrl, 'image/png');
        $this->addMessage($conversation, MessageType::Text, MessageDirection::INBOUND, 'entre medio');
        $this->addMessage($conversation, MessageType::Image, MessageDirection::INBOUND, '', $mediaUrl, 'image/png');

        $history = $this->buildHistory($conversation);

        // Primera imagen: degradada a placeholder de texto.
        $this->assertIsString($history[0]['content']);
        $this->assertStringContainsString('[El cliente envió una imagen]', $history[0]['content']);

        // Última imagen: bloque visual.
        $this->assertIsArray($history[2]['content']);
        $this->assertSame('image', $history[2]['content'][0]['type']);
    }

    public function test_oversized_image_degrades_to_placeholder(): void
    {
        Storage::fake('public');
        config(['services.ai.max_image_bytes' => 10]);

        $conversation = $this->makeConversation();
        $mediaUrl = $this->storeImage($conversation);
        $this->addMessage($conversation, MessageType::Image, MessageDirection::INBOUND, '', $mediaUrl, 'image/png');

        $history = $this->buildHistory($conversation);

        $this->assertIsString($history[0]['content']);
        $this->assertStringContainsString('[El cliente envió una imagen]', $history[0]['content']);
    }

    public function test_override_note_appended_to_text_block_when_bot_spoke(): void
    {
        Storage::fake('public');

        $conversation = $this->makeConversation();
        $mediaUrl = $this->storeImage($conversation);

        // El bot ya respondió antes → hay riesgo de contaminación y se anexa la nota.
        $this->addMessage($conversation, MessageType::Text, MessageDirection::INBOUND, 'Hola');
        $this->addMessage($conversation, MessageType::Text, MessageDirection::OUTBOUND, 'No tengo esa info');
        $this->addMessage($conversation, MessageType::Image, MessageDirection::INBOUND, 'Y esto?', $mediaUrl, 'image/png');

        $history = $this->buildHistory($conversation);

        $last = end($history);
        $this->assertIsArray($last['content']);
        $textBlock = collect($last['content'])->firstWhere('type', 'text');
        $this->assertStringContainsString(AiReplyService::HISTORY_OVERRIDE_NOTE, $textBlock['text']);
    }

    public function test_override_note_added_as_text_block_when_image_has_no_caption(): void
    {
        Storage::fake('public');

        $conversation = $this->makeConversation();
        $mediaUrl = $this->storeImage($conversation);

        $this->addMessage($conversation, MessageType::Text, MessageDirection::INBOUND, 'Hola');
        $this->addMessage($conversation, MessageType::Text, MessageDirection::OUTBOUND, 'No tengo esa info');
        // Imagen sin caption como último turno: la nota debe agregarse como bloque de texto nuevo.
        $this->addMessage($conversation, MessageType::Image, MessageDirection::INBOUND, '', $mediaUrl, 'image/png');

        $history = $this->buildHistory($conversation);

        $last = end($history);
        $textBlock = collect($last['content'])->firstWhere('type', 'text');
        $this->assertNotNull($textBlock);
        $this->assertStringContainsString(AiReplyService::HISTORY_OVERRIDE_NOTE, $textBlock['text']);
    }
}
