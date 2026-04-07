<?php

namespace Tests\Feature;

use App\Enums\MessageDirection;
use App\Enums\MessageType;
use App\Enums\SenderType;
use App\Enums\UserRole;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MessageLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_updating_latest_message_refreshes_conversation_preview(): void
    {
        [$user, $conversation, $firstMessage, $latestMessage] = $this->createConversationWithMessages();

        Sanctum::actingAs($user);

        $response = $this->putJson("/api/messages/{$latestMessage->id}", [
            'content' => 'Latest message edited',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.content', 'Latest message edited');

        $conversation->refresh();

        $this->assertSame('Latest message edited', $conversation->last_message_content);
        $this->assertTrue($conversation->last_message_at->equalTo($latestMessage->created_at));
        $this->assertSame('First message', $firstMessage->fresh()->content);
    }

    public function test_deleting_latest_message_recomputes_preview_and_keeps_tombstone_in_history(): void
    {
        [$user, $conversation, $firstMessage, $latestMessage] = $this->createConversationWithMessages();

        Sanctum::actingAs($user);

        $this->deleteJson("/api/messages/{$latestMessage->id}")
            ->assertOk();

        $conversation->refresh();

        $this->assertSame('First message', $conversation->last_message_content);
        $this->assertTrue($conversation->last_message_at->equalTo($firstMessage->created_at));

        $deletedMessage = Message::withTrashed()->find($latestMessage->id);
        $this->assertNotNull($deletedMessage?->deleted_at);

        $this->getJson("/api/conversations/{$conversation->id}")
            ->assertOk()
            ->assertJsonCount(2, 'data.messages')
            ->assertJsonPath('data.messages.1.id', $latestMessage->id)
            ->assertJsonPath('data.messages.1.deleted_at', $deletedMessage->deleted_at?->toJSON());

        $this->getJson("/api/conversations/{$conversation->id}/messages")
            ->assertOk()
            ->assertJsonPath('total', 2)
            ->assertJsonCount(2, 'data');
    }

    /**
     * @return array{0: User, 1: Conversation, 2: Message, 3: Message}
     */
    private function createConversationWithMessages(): array
    {
        $tenant = Tenant::create([
            'name' => 'Acme',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => UserRole::ADMIN,
        ]);

        Sanctum::actingAs($user);

        $channel = Channel::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'type' => 'whatsapp',
            'name' => 'Main channel',
            'status' => 'active',
        ]);

        $contact = Contact::create([
            'tenant_id' => $tenant->id,
            'name' => 'Jane Doe',
            'phone' => '+5491111111111',
            'source' => 'whatsapp',
        ]);

        $conversation = Conversation::create([
            'tenant_id' => $tenant->id,
            'channel_id' => $channel->id,
            'contact_id' => $contact->id,
            'status' => 'open',
        ]);

        $firstMessage = $this->createMessage($conversation, $user, 'First message', now()->subMinute());
        $latestMessage = $this->createMessage($conversation, $user, 'Latest message', now());

        $conversation->syncLastMessageSummary();
        $conversation->refresh();

        return [$user, $conversation, $firstMessage, $latestMessage];
    }

    private function createMessage(Conversation $conversation, User $user, string $content, $createdAt): Message
    {
        $message = Message::unguarded(function () use ($conversation, $user, $content, $createdAt) {
            return Message::create([
                'tenant_id' => $conversation->tenant_id,
                'conversation_id' => $conversation->id,
                'sender_type' => SenderType::USER,
                'sender_id' => $user->id,
                'content' => $content,
                'message_type' => MessageType::Text,
                'direction' => MessageDirection::OUTBOUND,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        });

        $message->forceFill([
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ])->saveQuietly();

        return $message->fresh();
    }
}
