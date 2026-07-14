<?php

namespace Tests\Feature;

use App\Enums\ChannelType;
use App\Enums\MessageDirection;
use App\Enums\UserRole;
use App\Events\MessageSent;
use App\Events\TenantMessageReceived;
use App\Jobs\GenerateAiReplyJob;
use App\Models\AiConfig;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\InstagramConfig;
use App\Models\Message;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class InstagramWebhookTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/instagram-webhook';

    private const APP_SECRET = 'test-app-secret';

    private const VERIFY_TOKEN = 'test-verify-token';

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.facebook.app_secret', self::APP_SECRET);
        config()->set('services.facebook.verify_token', self::VERIFY_TOKEN);
        config()->set('services.facebook.graph_version', 'v21.0');
    }

    public function test_get_verify_with_correct_token_returns_challenge(): void
    {
        $response = $this->get(self::ENDPOINT.'?hub_mode=subscribe&hub_verify_token='.self::VERIFY_TOKEN.'&hub_challenge=CH123');

        $response->assertOk();
        $this->assertSame('CH123', $response->getContent());
    }

    public function test_get_verify_with_wrong_token_returns_403(): void
    {
        $response = $this->get(self::ENDPOINT.'?hub_mode=subscribe&hub_verify_token=WRONG&hub_challenge=CH123');

        $response->assertStatus(403);
    }

    public function test_post_with_invalid_signature_returns_403(): void
    {
        [$channel] = $this->createChannel();
        $payload = $this->messagingPayload($channel->external_id, 'IGSID_1', 'hola', 'mid_1');

        $response = $this->postWebhook($payload, 'sha256=deadbeef');

        $response->assertStatus(403);
        $this->assertSame(0, Message::count());
    }

    public function test_inbound_text_creates_contact_conversation_and_message(): void
    {
        Event::fake([MessageSent::class, TenantMessageReceived::class]);
        Queue::fake();
        Http::fake(); // el hydrate de perfil no debe romper

        [$channel, $tenant] = $this->createChannel();

        $payload = $this->messagingPayload($channel->external_id, 'IGSID_1', 'hola', 'mid_1');
        $this->postWebhook($payload)->assertOk();

        $contact = Contact::first();
        $this->assertSame('instagram', $contact->source);
        $this->assertSame('IGSID_1', $contact->external_id);
        $this->assertNull($contact->phone);

        $conversation = Conversation::first();
        $this->assertFalse((bool) $conversation->ai_autoreply_enabled);

        $message = Message::first();
        $this->assertSame('hola', $message->content);
        $this->assertSame(MessageDirection::INBOUND, $message->direction);
        $this->assertSame('mid_1', $message->external_id);

        Event::assertDispatched(MessageSent::class);
        Event::assertDispatched(TenantMessageReceived::class);
        // Con ai_autoreply_default=false (default del canal) no se despacha IA.
        Queue::assertNotPushed(GenerateAiReplyJob::class);
    }

    public function test_inbound_dispatches_ai_reply_when_autoreply_enabled(): void
    {
        Event::fake();
        Queue::fake();
        Http::fake();

        [$channel, $tenant] = $this->createChannel(aiDefault: true);

        AiConfig::create([
            'tenant_id' => $tenant->id,
            'provider' => 'claude',
            'api_key' => Crypt::encryptString('sk-test'),
            'model' => 'claude-sonnet-5',
            'enabled' => true,
        ]);

        $payload = $this->messagingPayload($channel->external_id, 'IGSID_1', 'hola bot', 'mid_ai');
        $this->postWebhook($payload)->assertOk();

        $this->assertTrue((bool) Conversation::first()->ai_autoreply_enabled);
        Queue::assertPushed(GenerateAiReplyJob::class);
    }

    public function test_echo_from_ig_app_disables_autoreply_handoff(): void
    {
        Event::fake();
        Queue::fake();
        Http::fake();

        [$channel] = $this->createChannel(aiDefault: true);

        // Echo tipeado por el dueño desde la app de IG (mid desconocido, no
        // deduplicado) → handoff: el bot se apaga en esa conversación.
        $payload = $this->messagingPayload('IGSID_1', $channel->external_id, 'respondo yo', 'mid_echo_handoff', isEcho: true);
        $this->postWebhook($payload)->assertOk();

        $this->assertFalse((bool) Conversation::first()->ai_autoreply_enabled);
        Queue::assertNotPushed(GenerateAiReplyJob::class);
    }

    public function test_inbound_via_changes_format_is_also_parsed(): void
    {
        Event::fake();
        Http::fake();

        [$channel] = $this->createChannel();

        $payload = $this->changesPayload($channel->external_id, 'IGSID_1', 'desde changes', 'mid_changes');
        $this->postWebhook($payload)->assertOk();

        $this->assertSame(1, Message::count());
        $this->assertSame('desde changes', Message::first()->content);
    }

    public function test_inbound_image_attachment_is_downloaded(): void
    {
        Event::fake();
        Storage::fake('public');
        Http::fake([
            'https://cdn.example.com/*' => Http::response('BINARYDATA', 200, ['Content-Type' => 'image/jpeg']),
            '*' => Http::response([], 200),
        ]);

        [$channel, $tenant] = $this->createChannel();

        $payload = $this->attachmentPayload($channel->external_id, 'IGSID_1', 'image', 'https://cdn.example.com/pic.jpg', 'mid_img');
        $this->postWebhook($payload)->assertOk();

        $message = Message::first();
        $this->assertNotNull($message->media_url);
        $this->assertStringContainsString("messages/{$tenant->id}/", $message->media_url);
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $message->media_url));
    }

    public function test_echo_message_is_stored_as_outbound(): void
    {
        Event::fake();
        Http::fake();

        [$channel] = $this->createChannel();

        // is_echo: sender = negocio, recipient = contacto.
        $payload = $this->messagingPayload('IGSID_1', $channel->external_id, 'respuesta del dueño', 'mid_echo', isEcho: true);
        $this->postWebhook($payload)->assertOk();

        $message = Message::first();
        $this->assertSame(MessageDirection::OUTBOUND, $message->direction);
        $this->assertSame('mid_echo', $message->external_id);
    }

    public function test_duplicate_mid_is_deduped(): void
    {
        Event::fake();
        Http::fake();

        [$channel] = $this->createChannel();

        $payload = $this->messagingPayload($channel->external_id, 'IGSID_1', 'hola', 'mid_dup');
        $this->postWebhook($payload)->assertOk();
        $this->postWebhook($payload)->assertOk();

        $this->assertSame(1, Message::where('external_id', 'mid_dup')->count());
    }

    public function test_channel_resolved_by_page_id_backfills_webhook_object_id(): void
    {
        Event::fake();
        Http::fake();

        [$channel, $tenant, $config] = $this->createChannel();
        // Simular que el webhook_object_id no estaba seteado y el entry.id llega
        // con el page_id.
        $config->update(['webhook_object_id' => null]);

        $payload = $this->messagingPayload($config->page_id, 'IGSID_1', 'hola', 'mid_pg');
        $this->postWebhook($payload)->assertOk();

        $this->assertSame(1, Message::count());
        $config->refresh();
        $this->assertSame($config->page_id, $config->webhook_object_id);
    }

    // ---------------------------------------------------------------------

    /**
     * @return array{0: Channel, 1: Tenant, 2: InstagramConfig}
     */
    private function createChannel(bool $aiDefault = false): array
    {
        $tenant = Tenant::create(['name' => 'Acme']);
        $user = User::factory()->create(['tenant_id' => $tenant->id, 'role' => UserRole::ADMIN]);

        $config = InstagramConfig::create([
            'tenant_id' => $tenant->id,
            'ig_user_id' => 'IG_BIZ_1',
            'page_id' => 'PAGE_1',
            'webhook_object_id' => 'IG_BIZ_1',
            'username' => 'acme',
            'page_access_token' => Crypt::encryptString('PAGE_TOKEN'),
            'ai_autoreply_default' => $aiDefault,
        ]);

        $channel = Channel::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'instagram_config_id' => $config->id,
            'type' => ChannelType::INSTAGRAM,
            'external_id' => 'IG_BIZ_1',
            'name' => '@acme',
            'status' => 'active',
        ]);

        return [$channel, $tenant, $config];
    }

    private function postWebhook(array $payload, ?string $signature = null)
    {
        $body = json_encode($payload);
        $signature ??= 'sha256='.hash_hmac('sha256', $body, self::APP_SECRET);

        return $this->call(
            'POST',
            self::ENDPOINT,
            [],
            [],
            [],
            ['HTTP_X-Hub-Signature-256' => $signature, 'CONTENT_TYPE' => 'application/json'],
            $body,
        );
    }

    private function messagingPayload(string $entryId, string $senderId, string $text, string $mid, bool $isEcho = false): array
    {
        $message = ['mid' => $mid, 'text' => $text];
        if ($isEcho) {
            $message['is_echo'] = true;
        }

        return [
            'object' => 'instagram',
            'entry' => [[
                'id' => $entryId,
                'time' => now()->timestamp,
                'messaging' => [[
                    'sender' => ['id' => $senderId],
                    'recipient' => ['id' => $isEcho ? 'IGSID_1' : $entryId],
                    'message' => $message,
                ]],
            ]],
        ];
    }

    private function changesPayload(string $entryId, string $senderId, string $text, string $mid): array
    {
        return [
            'object' => 'instagram',
            'entry' => [[
                'id' => $entryId,
                'time' => now()->timestamp,
                'changes' => [[
                    'field' => 'messages',
                    'value' => [
                        'sender' => ['id' => $senderId],
                        'recipient' => ['id' => $entryId],
                        'message' => ['mid' => $mid, 'text' => $text],
                    ],
                ]],
            ]],
        ];
    }

    private function attachmentPayload(string $entryId, string $senderId, string $type, string $url, string $mid): array
    {
        return [
            'object' => 'instagram',
            'entry' => [[
                'id' => $entryId,
                'time' => now()->timestamp,
                'messaging' => [[
                    'sender' => ['id' => $senderId],
                    'recipient' => ['id' => $entryId],
                    'message' => [
                        'mid' => $mid,
                        'attachments' => [[
                            'type' => $type,
                            'payload' => ['url' => $url],
                        ]],
                    ],
                ]],
            ]],
        ];
    }
}
