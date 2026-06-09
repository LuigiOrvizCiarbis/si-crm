<?php

namespace Tests\Feature\Api;

use App\Enums\ChannelType;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Note;
use App\Models\Tenant;
use App\Models\User;
use App\Support\PermissionCatalog;
use App\Support\RoleProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class NoteControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = $this->seedTenantWithRoles('Acme');
        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->user->assignRole('Owner');
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

    public function test_store_creates_note_for_contact_and_sets_author(): void
    {
        Sanctum::actingAs($this->user);
        $contact = $this->makeContact();

        $response = $this->postJson('/api/notes', [
            'contact_id' => $contact->id,
            'body' => 'Cliente interesado en 2 dormitorios',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.body', 'Cliente interesado en 2 dormitorios')
            ->assertJsonPath('data.author.id', $this->user->id);

        $this->assertDatabaseHas('notes', [
            'contact_id' => $contact->id,
            'tenant_id' => $this->tenant->id,
            'created_by' => $this->user->id,
        ]);
    }

    public function test_store_requires_contact_or_conversation(): void
    {
        Sanctum::actingAs($this->user);

        $this->postJson('/api/notes', ['body' => 'Sin relación'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['contact_id', 'conversation_id']);
    }

    public function test_store_forbids_notes_on_hidden_contacts_and_conversations(): void
    {
        $member = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $member->assignRole('Member');

        $channel = Channel::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
            'type' => ChannelType::WHATSAPP,
            'name' => 'Main channel',
            'status' => 'active',
        ]);

        $hiddenContact = $this->makeContact();
        $visibleContact = $this->makeContact();

        Conversation::create([
            'tenant_id' => $this->tenant->id,
            'channel_id' => $channel->id,
            'contact_id' => $visibleContact->id,
            'assigned_to' => $member->id,
            'status' => 'open',
        ]);
        $hiddenConversation = Conversation::create([
            'tenant_id' => $this->tenant->id,
            'channel_id' => $channel->id,
            'contact_id' => $visibleContact->id,
            'assigned_to' => $this->user->id,
            'status' => 'open',
        ]);

        Sanctum::actingAs($member);

        $this->postJson('/api/notes', [
            'contact_id' => $hiddenContact->id,
            'body' => 'Hidden contact note',
        ])->assertForbidden();

        $this->postJson('/api/notes', [
            'conversation_id' => $hiddenConversation->id,
            'body' => 'Hidden conversation note',
        ])->assertForbidden();

        $this->assertDatabaseMissing('notes', ['body' => 'Hidden contact note']);
        $this->assertDatabaseMissing('notes', ['body' => 'Hidden conversation note']);
    }

    public function test_index_filters_by_contact(): void
    {
        Sanctum::actingAs($this->user);
        $contact = $this->makeContact();
        $other = $this->makeContact();

        Note::create(['tenant_id' => $this->tenant->id, 'contact_id' => $contact->id, 'body' => 'A']);
        Note::create(['tenant_id' => $this->tenant->id, 'contact_id' => $other->id, 'body' => 'B']);

        $this->getJson("/api/notes?contact_id={$contact->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.body', 'A');
    }

    public function test_index_only_lists_notes_for_visible_contacts_or_conversations(): void
    {
        $member = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $member->assignRole('Member');

        $channel = Channel::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
            'type' => ChannelType::WHATSAPP,
            'name' => 'Main channel',
            'status' => 'active',
        ]);

        $visibleContact = $this->makeContact();
        $hiddenContact = $this->makeContact();

        $visibleConversation = Conversation::create([
            'tenant_id' => $this->tenant->id,
            'channel_id' => $channel->id,
            'contact_id' => $visibleContact->id,
            'assigned_to' => $member->id,
            'status' => 'open',
        ]);
        $hiddenConversation = Conversation::create([
            'tenant_id' => $this->tenant->id,
            'channel_id' => $channel->id,
            'contact_id' => $hiddenContact->id,
            'assigned_to' => $this->user->id,
            'status' => 'open',
        ]);

        Note::create([
            'tenant_id' => $this->tenant->id,
            'contact_id' => $visibleContact->id,
            'body' => 'Visible by contact',
        ]);
        Note::create([
            'tenant_id' => $this->tenant->id,
            'contact_id' => $hiddenContact->id,
            'body' => 'Hidden by contact',
        ]);
        Note::create([
            'tenant_id' => $this->tenant->id,
            'conversation_id' => $visibleConversation->id,
            'body' => 'Visible by conversation',
        ]);
        Note::create([
            'tenant_id' => $this->tenant->id,
            'conversation_id' => $hiddenConversation->id,
            'body' => 'Hidden by conversation',
        ]);

        Sanctum::actingAs($member);

        $this->getJson('/api/notes')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['body' => 'Visible by contact'])
            ->assertJsonFragment(['body' => 'Visible by conversation'])
            ->assertJsonMissing(['body' => 'Hidden by contact'])
            ->assertJsonMissing(['body' => 'Hidden by conversation']);
    }

    public function test_destroy_removes_note(): void
    {
        Sanctum::actingAs($this->user);
        $contact = $this->makeContact();
        $note = Note::create(['tenant_id' => $this->tenant->id, 'contact_id' => $contact->id, 'body' => 'Borrar']);

        $this->deleteJson("/api/notes/{$note->id}")->assertOk();

        $this->assertDatabaseMissing('notes', ['id' => $note->id]);
    }

    public function test_destroy_forbidden_for_non_author_non_owner(): void
    {
        $contact = $this->makeContact();
        $note = Note::create([
            'tenant_id' => $this->tenant->id,
            'contact_id' => $contact->id,
            'created_by' => $this->user->id,
            'body' => 'Del owner',
        ]);

        $employee = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $employee->assignRole('Member');
        Sanctum::actingAs($employee);

        $this->deleteJson("/api/notes/{$note->id}")->assertForbidden();
        $this->assertDatabaseHas('notes', ['id' => $note->id]);
    }

    public function test_author_can_delete_own_note(): void
    {
        $contact = $this->makeContact();

        $employee = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $employee->assignRole('Member');
        $note = Note::create([
            'tenant_id' => $this->tenant->id,
            'contact_id' => $contact->id,
            'created_by' => $employee->id,
            'body' => 'Propia',
        ]);

        Sanctum::actingAs($employee);

        $this->deleteJson("/api/notes/{$note->id}")->assertOk();
        $this->assertDatabaseMissing('notes', ['id' => $note->id]);
    }

    public function test_notes_are_scoped_by_tenant(): void
    {
        $otherTenant = $this->seedTenantWithRoles('Other');
        $otherContact = Contact::create([
            'tenant_id' => $otherTenant->id,
            'name' => 'Foreign',
            'phone' => '+549'.fake()->numerify('##########'),
            'source' => 'whatsapp',
        ]);
        Note::create(['tenant_id' => $otherTenant->id, 'contact_id' => $otherContact->id, 'body' => 'Ajeno']);

        Sanctum::actingAs($this->user);

        $this->getJson('/api/notes')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
