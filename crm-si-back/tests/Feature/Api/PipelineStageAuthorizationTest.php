<?php

namespace Tests\Feature\Api;

use App\Models\PipelineStage;
use App\Models\Tenant;
use App\Models\User;
use App\Support\PermissionCatalog;
use App\Support\RoleProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class PipelineStageAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_stage(): void
    {
        [$user] = $this->createOwner();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/pipeline-stages', [
            'name' => 'Prospecto',
            'color' => '#FF0000',
        ]);

        $response->assertCreated()
            ->assertJsonPath('name', 'Prospecto')
            ->assertJsonPath('color', '#FF0000');

        $this->assertDatabaseHas('pipeline_stages', ['name' => 'Prospecto', 'color' => '#FF0000']);
    }

    public function test_create_defaults_color_when_omitted(): void
    {
        [$user] = $this->createOwner();
        Sanctum::actingAs($user);

        $this->postJson('/api/pipeline-stages', ['name' => 'Sin color'])
            ->assertCreated()
            ->assertJsonPath('color', '#3B82F6');
    }

    public function test_create_rejects_invalid_color(): void
    {
        [$user] = $this->createOwner();
        Sanctum::actingAs($user);

        $this->postJson('/api/pipeline-stages', [
            'name' => 'Mala',
            'color' => 'red',
        ])->assertStatus(422)->assertJsonValidationErrors('color');
    }

    public function test_member_without_manage_cannot_create_stage(): void
    {
        $tenant = $this->seedTenantWithRoles();
        $member = User::factory()->create(['tenant_id' => $tenant->id]);
        $member->assignRole('Member');
        Sanctum::actingAs($member);

        $this->postJson('/api/pipeline-stages', ['name' => 'Nope'])->assertForbidden();
    }

    public function test_member_with_view_can_list_stages(): void
    {
        $tenant = $this->seedTenantWithRoles();
        $member = User::factory()->create(['tenant_id' => $tenant->id]);
        $member->assignRole('Member');
        Sanctum::actingAs($member);

        $this->getJson('/api/pipeline-stages')->assertOk();
    }

    public function test_owner_can_update_stage(): void
    {
        [$user, $tenant] = $this->createOwner();
        Sanctum::actingAs($user);

        $stage = PipelineStage::create([
            'tenant_id' => $tenant->id,
            'name' => 'Original',
            'color' => '#000000',
            'sort_order' => 1,
        ]);

        $this->putJson("/api/pipeline-stages/{$stage->id}", [
            'name' => 'Editada',
            'color' => '#123ABC',
        ])->assertOk()
            ->assertJsonPath('name', 'Editada')
            ->assertJsonPath('color', '#123ABC');
    }

    public function test_member_cannot_update_stage(): void
    {
        $tenant = $this->seedTenantWithRoles();
        $member = User::factory()->create(['tenant_id' => $tenant->id]);
        $member->assignRole('Member');

        $stage = PipelineStage::create([
            'tenant_id' => $tenant->id,
            'name' => 'Original',
            'color' => '#000000',
            'sort_order' => 1,
        ]);

        Sanctum::actingAs($member);

        $this->putJson("/api/pipeline-stages/{$stage->id}", ['name' => 'Hack'])->assertForbidden();
    }

    public function test_owner_can_delete_stage(): void
    {
        [$user, $tenant] = $this->createOwner();
        Sanctum::actingAs($user);

        $stage = PipelineStage::create([
            'tenant_id' => $tenant->id,
            'name' => 'Borrar',
            'color' => '#000000',
            'sort_order' => 1,
        ]);

        $this->deleteJson("/api/pipeline-stages/{$stage->id}")->assertNoContent();
        $this->assertDatabaseMissing('pipeline_stages', ['id' => $stage->id]);
    }

    public function test_member_cannot_delete_stage(): void
    {
        $tenant = $this->seedTenantWithRoles();
        $member = User::factory()->create(['tenant_id' => $tenant->id]);
        $member->assignRole('Member');

        $stage = PipelineStage::create([
            'tenant_id' => $tenant->id,
            'name' => 'Borrar',
            'color' => '#000000',
            'sort_order' => 1,
        ]);

        Sanctum::actingAs($member);

        $this->deleteJson("/api/pipeline-stages/{$stage->id}")->assertForbidden();
    }

    public function test_owner_can_reorder_stages(): void
    {
        [$user, $tenant] = $this->createOwner();
        Sanctum::actingAs($user);

        $a = PipelineStage::create(['tenant_id' => $tenant->id, 'name' => 'A', 'color' => '#000000', 'sort_order' => 1]);
        $b = PipelineStage::create(['tenant_id' => $tenant->id, 'name' => 'B', 'color' => '#000000', 'sort_order' => 2]);

        $this->postJson('/api/pipeline-stages/reorder', [
            'stages' => [
                ['id' => $a->id, 'sort_order' => 2],
                ['id' => $b->id, 'sort_order' => 1],
            ],
        ])->assertOk();

        $this->assertSame(2, $a->fresh()->sort_order);
        $this->assertSame(1, $b->fresh()->sort_order);
    }

    public function test_member_cannot_reorder_stages(): void
    {
        $tenant = $this->seedTenantWithRoles();
        $member = User::factory()->create(['tenant_id' => $tenant->id]);
        $member->assignRole('Member');
        Sanctum::actingAs($member);

        $this->postJson('/api/pipeline-stages/reorder', ['stages' => []])->assertForbidden();
    }

    public function test_tenant_isolation_on_stages(): void
    {
        [$userA, $tenantA] = $this->createOwner();

        $tenantB = $this->seedTenantWithRoles();
        $userB = User::factory()->create(['tenant_id' => $tenantB->id]);
        $userB->assignRole('Owner');

        PipelineStage::create(['tenant_id' => $tenantA->id, 'name' => 'Solo A', 'color' => '#000000', 'sort_order' => 1]);

        Sanctum::actingAs($userB);
        $list = $this->getJson('/api/pipeline-stages');
        $list->assertOk();

        $names = collect($list->json())->pluck('name');
        $this->assertFalse($names->contains('Solo A'));
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
}
