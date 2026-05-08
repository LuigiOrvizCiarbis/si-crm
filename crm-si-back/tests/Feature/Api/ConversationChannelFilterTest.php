<?php

namespace Tests\Feature\Api;

use App\Enums\ChannelType;
use App\Enums\UserRole;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ConversationChannelFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_channel_filter_includes_conversations_assigned_to_channel_owner(): void
    {
        $tenant = Tenant::create(['name' => 'Acme']);

        $admin = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => UserRole::ADMIN,
        ]);

        $seller = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => UserRole::EMPLOYEE,
        ]);

        $selectedChannel = Channel::create([
            'tenant_id' => $tenant->id,
            'user_id' => $seller->id,
            'type' => ChannelType::WHATSAPP,
            'name' => 'Seller channel',
            'status' => 'active',
        ]);

        $otherChannel = Channel::create([
            'tenant_id' => $tenant->id,
            'user_id' => $admin->id,
            'type' => ChannelType::WHATSAPP,
            'name' => 'Other channel',
            'status' => 'active',
        ]);

        $directContact = Contact::create([
            'tenant_id' => $tenant->id,
            'name' => 'Direct Contact',
            'phone' => '+5491111111111',
            'source' => 'whatsapp',
        ]);

        $assignedContact = Contact::create([
            'tenant_id' => $tenant->id,
            'name' => 'Assigned Contact',
            'phone' => '+5492222222222',
            'source' => 'whatsapp',
        ]);

        $directConversation = Conversation::create([
            'tenant_id' => $tenant->id,
            'channel_id' => $selectedChannel->id,
            'contact_id' => $directContact->id,
            'status' => 'open',
            'last_message_at' => now()->subMinute(),
        ]);

        $assignedConversation = Conversation::create([
            'tenant_id' => $tenant->id,
            'channel_id' => $otherChannel->id,
            'contact_id' => $assignedContact->id,
            'assigned_to' => $seller->id,
            'status' => 'open',
            'last_message_at' => now(),
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson("/api/conversations?channel_id={$selectedChannel->id}");

        $response->assertOk();

        $ids = collect($response->json('data'))->pluck('id');

        $this->assertTrue($ids->contains($directConversation->id));
        $this->assertTrue($ids->contains($assignedConversation->id));
    }
}
