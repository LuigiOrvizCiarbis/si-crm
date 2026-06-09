<?php

namespace Tests\Feature\Api;

use App\Enums\ChannelType;
use App\Enums\MessageDirection;
use App\Enums\SenderType;
use App\Enums\UserRole;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Tenant;
use App\Models\User;
use App\Support\PermissionCatalog;
use App\Support\RoleProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ConversationBulkReadTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    private Channel $channel;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = $this->seedTenantWithRoles('Acme');

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->user->assignRole('Owner');

        $this->channel = Channel::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
            'type' => ChannelType::WHATSAPP,
            'name' => 'Main channel',
            'status' => 'active',
        ]);
    }

    private function seedTenantWithRoles(string $name): Tenant
    {
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId(null);
        foreach (PermissionCatalog::all() as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
        $registrar->forgetCachedPermissions();

        $tenant = Tenant::create(['name' => $name.' '.uniqid()]);
        app(RoleProvisioner::class)->provisionDefaultRoles($tenant);
        $registrar->setPermissionsTeamId($tenant->id);

        return $tenant;
    }

    private function makeConversation(?string $contactName = 'Contact'): Conversation
    {
        $contact = Contact::create([
            'tenant_id' => $this->tenant->id,
            'name' => $contactName,
            'phone' => '+549'.fake()->numerify('##########'),
            'source' => 'whatsapp',
        ]);

        return Conversation::create([
            'tenant_id' => $this->tenant->id,
            'channel_id' => $this->channel->id,
            'contact_id' => $contact->id,
            'status' => 'open',
        ]);
    }

    private function addInboundMessage(Conversation $conversation, bool $read): Message
    {
        return Message::create([
            'tenant_id' => $this->tenant->id,
            'conversation_id' => $conversation->id,
            'sender_type' => SenderType::CONTACT,
            'sender_id' => $conversation->contact_id,
            'content' => 'Inbound message',
            'direction' => MessageDirection::INBOUND,
            'read_at' => $read ? now() : null,
        ]);
    }

    public function test_bulk_mark_unread_sets_flag_even_without_inbound_messages(): void
    {
        Sanctum::actingAs($this->user);

        $conversation = $this->makeConversation(); // sin mensajes (caso "sin nombre")

        $this->postJson('/api/conversations/bulk-read', [
            'ids' => [$conversation->id],
            'read' => false,
        ])
            ->assertOk()
            ->assertJson([
                'updated' => 1,
                'failed' => 0,
                'read' => false,
            ]);

        $this->assertTrue($conversation->fresh()->manual_unread);
    }

    public function test_bulk_mark_read_clears_manual_flag_and_reads_messages(): void
    {
        Sanctum::actingAs($this->user);

        $flagged = $this->makeConversation();
        $flagged->update(['manual_unread' => true]);

        $withUnread = $this->makeConversation();
        $this->addInboundMessage($withUnread, read: false);

        $this->postJson('/api/conversations/bulk-read', [
            'ids' => [$flagged->id, $withUnread->id],
            'read' => true,
        ])
            ->assertOk()
            ->assertJson([
                'updated' => 2,
                'failed' => 0,
                'read' => true,
            ]);

        $this->assertFalse($flagged->fresh()->manual_unread);
        $this->assertNotNull($withUnread->messages()->first()->read_at);
    }

    public function test_already_read_conversations_count_as_updated_not_failed(): void
    {
        Sanctum::actingAs($this->user);

        // Conversación ya leída: sin inbound sin leer y sin flag manual.
        $alreadyRead = $this->makeConversation();
        $this->addInboundMessage($alreadyRead, read: true);

        $this->postJson('/api/conversations/bulk-read', [
            'ids' => [$alreadyRead->id],
            'read' => true,
        ])
            ->assertOk()
            ->assertJson([
                'updated' => 1,
                'failed' => 0,
            ]);
    }

    public function test_conversations_from_other_tenant_count_as_failed(): void
    {
        Sanctum::actingAs($this->user);

        $otherTenant = Tenant::create(['name' => 'Other']);
        $otherUser = User::factory()->create([
            'tenant_id' => $otherTenant->id,
            'role' => UserRole::ADMIN,
        ]);
        $otherChannel = Channel::create([
            'tenant_id' => $otherTenant->id,
            'user_id' => $otherUser->id,
            'type' => ChannelType::WHATSAPP,
            'name' => 'Other channel',
            'status' => 'active',
        ]);
        $otherContact = Contact::create([
            'tenant_id' => $otherTenant->id,
            'name' => 'Other contact',
            'phone' => '+5490000000000',
            'source' => 'whatsapp',
        ]);
        $foreignConversation = Conversation::withoutGlobalScopes()->create([
            'tenant_id' => $otherTenant->id,
            'channel_id' => $otherChannel->id,
            'contact_id' => $otherContact->id,
            'status' => 'open',
        ]);

        $own = $this->makeConversation();

        $this->postJson('/api/conversations/bulk-read', [
            'ids' => [$own->id, $foreignConversation->id],
            'read' => false,
        ])
            ->assertOk()
            ->assertJson([
                'updated' => 1,
                'failed' => 1,
            ]);

        $this->assertTrue($own->fresh()->manual_unread);
    }

    public function test_index_marks_conversation_unread_when_manual_flag_is_set(): void
    {
        Sanctum::actingAs($this->user);

        $conversation = $this->makeConversation();
        $conversation->update(['manual_unread' => true]);

        $payload = collect($this->getJson('/api/conversations')->assertOk()->json('data'))
            ->firstWhere('id', $conversation->id);

        $this->assertTrue($payload['unread']);
        $this->assertTrue($payload['manual_unread']);
    }

    public function test_single_mark_unread_sets_flag_without_inbound(): void
    {
        Sanctum::actingAs($this->user);

        $conversation = $this->makeConversation();

        $this->postJson("/api/conversations/{$conversation->id}/unread")
            ->assertOk()
            ->assertJsonPath('data.marked', 1);

        $this->assertTrue($conversation->fresh()->manual_unread);
    }

    public function test_unread_count_summary_includes_manual_unread_conversations(): void
    {
        Sanctum::actingAs($this->user);

        $manual = $this->makeConversation();
        $manual->update(['manual_unread' => true]);

        $this->getJson('/api/conversations?summary=unread_count')
            ->assertOk()
            ->assertJsonPath('data.unread_count', 1);
    }

    public function test_bulk_validates_max_items(): void
    {
        Sanctum::actingAs($this->user);

        $this->postJson('/api/conversations/bulk-read', [
            'ids' => range(1, 5001),
            'read' => true,
        ])->assertStatus(422);
    }
}
