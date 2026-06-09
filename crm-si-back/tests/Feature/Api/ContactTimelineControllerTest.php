<?php

namespace Tests\Feature\Api;

use App\Enums\ChannelType;
use App\Enums\MessageDirection;
use App\Enums\SenderType;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Note;
use App\Models\Opportunity;
use App\Models\PipelineStage;
use App\Models\Task;
use App\Models\Tenant;
use App\Models\User;
use App\Support\PermissionCatalog;
use App\Support\RoleProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ContactTimelineControllerTest extends TestCase
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

    private function makeContact(): Contact
    {
        return Contact::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Contact',
            'phone' => '+549'.fake()->numerify('##########'),
            'source' => 'whatsapp',
        ]);
    }

    public function test_timeline_aggregates_all_event_types_ordered_desc(): void
    {
        Sanctum::actingAs($this->user);
        $contact = $this->makeContact();

        $conversation = Conversation::create([
            'tenant_id' => $this->tenant->id,
            'channel_id' => $this->channel->id,
            'contact_id' => $contact->id,
            'status' => 'open',
        ]);

        Message::create([
            'tenant_id' => $this->tenant->id,
            'conversation_id' => $conversation->id,
            'sender_type' => SenderType::CONTACT,
            'sender_id' => $contact->id,
            'content' => 'Hola',
            'direction' => MessageDirection::INBOUND,
            'created_at' => now()->subDays(5),
        ]);

        Note::create([
            'tenant_id' => $this->tenant->id,
            'contact_id' => $contact->id,
            'created_by' => $this->user->id,
            'body' => 'Nota de seguimiento',
            'created_at' => now()->subDays(3),
        ]);

        Task::create([
            'tenant_id' => $this->tenant->id,
            'contact_id' => $contact->id,
            'name' => 'Llamar al cliente',
            'created_at' => now()->subDays(2),
        ]);

        $stage = PipelineStage::create(['tenant_id' => $this->tenant->id, 'name' => 'Calificado']);
        Opportunity::create([
            'tenant_id' => $this->tenant->id,
            'contact_id' => $contact->id,
            'pipeline_stage_id' => $stage->id,
            'title' => 'Venta',
            'status' => 'open',
            'source_type' => 'manual',
            'last_activity_at' => now()->subDay(),
        ]);

        $response = $this->getJson("/api/contacts/{$contact->id}/timeline")->assertOk();

        $types = collect($response->json('data'))->pluck('type');
        $this->assertEqualsCanonicalizing(['note', 'task', 'message', 'stage'], $types->unique()->values()->all());

        $dates = collect($response->json('data'))->pluck('occurred_at')->all();
        $sorted = collect($dates)->sortDesc()->values()->all();
        $this->assertEquals($sorted, $dates);
    }

    public function test_timeline_filters_by_types(): void
    {
        Sanctum::actingAs($this->user);
        $contact = $this->makeContact();

        Note::create(['tenant_id' => $this->tenant->id, 'contact_id' => $contact->id, 'body' => 'Nota']);
        Task::create(['tenant_id' => $this->tenant->id, 'contact_id' => $contact->id, 'name' => 'Tarea']);

        $response = $this->getJson("/api/contacts/{$contact->id}/timeline?types=note")->assertOk();

        $types = collect($response->json('data'))->pluck('type')->unique()->values()->all();
        $this->assertEquals(['note'], $types);
    }

    public function test_timeline_only_includes_tasks_visible_to_the_user(): void
    {
        $member = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $member->assignRole('Member');
        $contact = $this->makeContact();

        Conversation::create([
            'tenant_id' => $this->tenant->id,
            'channel_id' => $this->channel->id,
            'contact_id' => $contact->id,
            'assigned_to' => $member->id,
            'status' => 'open',
        ]);

        Task::create([
            'tenant_id' => $this->tenant->id,
            'contact_id' => $contact->id,
            'assigned_to' => $member->id,
            'name' => 'Visible task',
        ]);
        Task::create([
            'tenant_id' => $this->tenant->id,
            'contact_id' => $contact->id,
            'assigned_to' => $this->user->id,
            'name' => 'Hidden task',
        ]);

        Sanctum::actingAs($member);

        $this->getJson("/api/contacts/{$contact->id}/timeline?types=task")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Visible task')
            ->assertJsonMissing(['name' => 'Hidden task']);
    }

    public function test_timeline_is_available_through_a_shared_conversation(): void
    {
        $member = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $member->assignRole('Member');
        $contact = $this->makeContact();

        $conversation = Conversation::create([
            'tenant_id' => $this->tenant->id,
            'channel_id' => $this->channel->id,
            'contact_id' => $contact->id,
            'status' => 'open',
        ]);
        $conversation->users()->attach($member->id);

        Note::create([
            'tenant_id' => $this->tenant->id,
            'contact_id' => $contact->id,
            'body' => 'Shared conversation note',
        ]);

        Sanctum::actingAs($member);

        $this->getJson("/api/contacts/{$contact->id}/timeline?types=note")
            ->assertOk()
            ->assertJsonPath('data.0.body', 'Shared conversation note');
    }

    public function test_timeline_refreshes_owner_role_context_for_sanctum_requests(): void
    {
        $contact = $this->makeContact();
        $registrar = app(PermissionRegistrar::class);

        $registrar->setPermissionsTeamId(null);
        $this->assertFalse($this->user->isTenantOwner());

        Sanctum::actingAs($this->user);

        $this->getJson("/api/contacts/{$contact->id}/timeline")
            ->assertOk();
    }

    public function test_timeline_forbidden_for_other_tenant_contact(): void
    {
        $otherTenant = $this->seedTenantWithRoles('Other');
        $foreign = Contact::create([
            'tenant_id' => $otherTenant->id,
            'name' => 'Foreign',
            'phone' => '+549'.fake()->numerify('##########'),
            'source' => 'whatsapp',
        ]);

        Sanctum::actingAs($this->user);

        $this->getJson("/api/contacts/{$foreign->id}/timeline")->assertNotFound();
    }
}
