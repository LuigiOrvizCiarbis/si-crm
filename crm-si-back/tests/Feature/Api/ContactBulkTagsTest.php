<?php

namespace Tests\Feature\Api;

use App\Enums\ChannelType;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Tag;
use App\Models\Tenant;
use App\Models\User;
use App\Support\PermissionCatalog;
use App\Support\RoleProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ContactBulkTagsTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_bulk_add_tags_to_contacts(): void
    {
        [$user, $tenant] = $this->createOwner();
        Sanctum::actingAs($user);

        $contacts = collect([1, 2, 3])->map(fn ($i) => $this->makeContact($tenant, "C{$i}"));
        $tag = $this->makeTag($tenant, $user, 'VIP');

        $response = $this->postJson('/api/contacts/bulk-tags', [
            'ids' => $contacts->pluck('id')->all(),
            'action' => 'add',
            'tag_ids' => [$tag->id],
        ]);

        $response->assertOk()
            ->assertJsonPath('updated', 3)
            ->assertJsonPath('failed', 0)
            ->assertJsonPath('action', 'add');

        foreach ($contacts as $contact) {
            $this->assertTrue($contact->tags()->where('tags.id', $tag->id)->exists());
        }
    }

    public function test_owner_can_bulk_remove_tags(): void
    {
        [$user, $tenant] = $this->createOwner();
        Sanctum::actingAs($user);

        $tag = $this->makeTag($tenant, $user, 'Cold');
        $contacts = collect([1, 2])->map(function ($i) use ($tenant, $tag, $user) {
            $c = $this->makeContact($tenant, "C{$i}");
            $c->tags()->attach($tag->id, ['tenant_id' => $tenant->id, 'assigned_by' => $user->id]);

            return $c;
        });

        $response = $this->postJson('/api/contacts/bulk-tags', [
            'ids' => $contacts->pluck('id')->all(),
            'action' => 'remove',
            'tag_ids' => [$tag->id],
        ]);

        $response->assertOk()->assertJsonPath('updated', 2);

        foreach ($contacts as $contact) {
            $this->assertFalse($contact->tags()->where('tags.id', $tag->id)->exists());
        }
    }

    public function test_owner_can_bulk_replace_tags(): void
    {
        [$user, $tenant] = $this->createOwner();
        Sanctum::actingAs($user);

        $oldTag = $this->makeTag($tenant, $user, 'Old');
        $newTag = $this->makeTag($tenant, $user, 'New');
        $contact = $this->makeContact($tenant, 'C1');
        $contact->tags()->attach($oldTag->id, ['tenant_id' => $tenant->id, 'assigned_by' => $user->id]);

        $response = $this->postJson('/api/contacts/bulk-tags', [
            'ids' => [$contact->id],
            'action' => 'replace',
            'tag_ids' => [$newTag->id],
        ]);

        $response->assertOk()->assertJsonPath('updated', 1);

        $tagIds = $contact->tags()->pluck('tags.id')->all();
        $this->assertSame([$newTag->id], $tagIds);
    }

    public function test_replace_with_empty_tag_ids_clears_all_tags(): void
    {
        [$user, $tenant] = $this->createOwner();
        Sanctum::actingAs($user);

        $tag = $this->makeTag($tenant, $user, 'X');
        $contact = $this->makeContact($tenant, 'C1');
        $contact->tags()->attach($tag->id, ['tenant_id' => $tenant->id, 'assigned_by' => $user->id]);

        $response = $this->postJson('/api/contacts/bulk-tags', [
            'ids' => [$contact->id],
            'action' => 'replace',
            'tag_ids' => [],
        ]);

        $response->assertOk()->assertJsonPath('updated', 1);
        $this->assertCount(0, $contact->tags()->get());
    }

    public function test_add_with_empty_tag_ids_returns_validation_error(): void
    {
        [$user, $tenant] = $this->createOwner();
        Sanctum::actingAs($user);

        $contact = $this->makeContact($tenant, 'C1');

        $this->postJson('/api/contacts/bulk-tags', [
            'ids' => [$contact->id],
            'action' => 'add',
            'tag_ids' => [],
        ])->assertStatus(422)->assertJsonValidationErrors('tag_ids');
    }

    public function test_contacts_from_other_tenant_are_not_modified(): void
    {
        [$user, $tenant] = $this->createOwner();
        Sanctum::actingAs($user);

        $otherTenant = Tenant::create(['name' => 'Other']);
        $foreignContact = $this->makeContact($otherTenant, 'Foreign');
        $ownContact = $this->makeContact($tenant, 'Own');
        $tag = $this->makeTag($tenant, $user, 'T');

        $response = $this->postJson('/api/contacts/bulk-tags', [
            'ids' => [$ownContact->id, $foreignContact->id],
            'action' => 'add',
            'tag_ids' => [$tag->id],
        ]);

        $response->assertOk()
            ->assertJsonPath('updated', 1)
            ->assertJsonPath('failed', 1);

        $this->assertTrue($ownContact->tags()->where('tags.id', $tag->id)->exists());
        $this->assertFalse($foreignContact->tags()->where('tags.id', $tag->id)->exists());
    }

    public function test_tag_from_other_tenant_is_rejected(): void
    {
        [$user, $tenant] = $this->createOwner();
        Sanctum::actingAs($user);

        $otherTenant = Tenant::create(['name' => 'Other']);
        $foreignUser = User::factory()->create(['tenant_id' => $otherTenant->id]);
        $foreignTag = $this->makeTag($otherTenant, $foreignUser, 'Foreign');
        $contact = $this->makeContact($tenant, 'C1');

        $this->postJson('/api/contacts/bulk-tags', [
            'ids' => [$contact->id],
            'action' => 'add',
            'tag_ids' => [$foreignTag->id],
        ])->assertStatus(422)->assertJsonValidationErrors('tag_ids.0');
    }

    public function test_empty_ids_returns_validation_error(): void
    {
        [$user] = $this->createOwner();
        Sanctum::actingAs($user);

        $this->postJson('/api/contacts/bulk-tags', [
            'ids' => [],
            'action' => 'add',
            'tag_ids' => [1],
        ])->assertStatus(422)->assertJsonValidationErrors('ids');
    }

    public function test_member_without_view_any_only_updates_assigned_contacts(): void
    {
        $tenant = $this->seedTenantWithRoles();

        $member = User::factory()->create(['tenant_id' => $tenant->id]);
        $member->assignRole('Member');

        $owner = User::factory()->create(['tenant_id' => $tenant->id]);
        $owner->assignRole('Owner');

        $channel = Channel::create([
            'tenant_id' => $tenant->id,
            'user_id' => $owner->id,
            'type' => ChannelType::WHATSAPP,
            'name' => 'WhatsApp',
            'status' => 'active',
        ]);

        $tag = $this->makeTag($tenant, $owner, 'T');

        $assigned = $this->makeContact($tenant, 'Mine');
        $unassigned = $this->makeContact($tenant, 'Theirs');

        Conversation::create([
            'tenant_id' => $tenant->id,
            'channel_id' => $channel->id,
            'contact_id' => $assigned->id,
            'assigned_to' => $member->id,
            'status' => 'open',
        ]);

        Sanctum::actingAs($member);

        $response = $this->postJson('/api/contacts/bulk-tags', [
            'ids' => [$assigned->id, $unassigned->id],
            'action' => 'add',
            'tag_ids' => [$tag->id],
        ]);

        $response->assertOk()
            ->assertJsonPath('updated', 1)
            ->assertJsonPath('failed', 1);

        $this->assertTrue($assigned->tags()->where('tags.id', $tag->id)->exists());
        $this->assertFalse($unassigned->tags()->where('tags.id', $tag->id)->exists());
    }

    private function createOwner(): array
    {
        $tenant = $this->seedTenantWithRoles();

        $user = User::factory()->create(['tenant_id' => $tenant->id]);
        $user->assignRole('Owner');

        return [$user, $tenant];
    }

    private function seedTenantWithRoles(): Tenant
    {
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId(null);
        foreach (PermissionCatalog::all() as $name) {
            Permission::findOrCreate($name, 'web');
        }
        $registrar->forgetCachedPermissions();

        $tenant = Tenant::create(['name' => 'Acme '.uniqid()]);
        app(RoleProvisioner::class)->provisionDefaultRoles($tenant);
        $registrar->setPermissionsTeamId($tenant->id);

        return $tenant;
    }

    private function makeContact(Tenant $tenant, string $name): Contact
    {
        return Contact::create([
            'tenant_id' => $tenant->id,
            'name' => $name,
            'phone' => '+549'.fake()->numerify('##########'),
            'source' => 'manual',
        ]);
    }

    private function makeTag(Tenant $tenant, User $creator, string $name): Tag
    {
        return Tag::create([
            'tenant_id' => $tenant->id,
            'created_by' => $creator->id,
            'name' => $name,
            'slug' => Str::slug($name).'-'.uniqid(),
            'color' => '#64748b',
        ]);
    }
}
