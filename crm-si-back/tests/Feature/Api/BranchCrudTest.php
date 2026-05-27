<?php

namespace Tests\Feature\Api;

use App\Models\Branch;
use App\Models\Tenant;
use App\Models\User;
use App\Support\RoleProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class BranchCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_branch(): void
    {
        [$tenant, $owner] = $this->makeOwnerTenant();
        Sanctum::actingAs($owner);

        $this->postJson('/api/branches', [
            'name' => 'Sucursal Norte',
            'address' => 'Av. Siempre Viva 123',
        ])->assertCreated()
            ->assertJsonPath('data.name', 'Sucursal Norte')
            ->assertJsonPath('data.tenant_id', $tenant->id);

        $this->assertDatabaseHas('branches', [
            'tenant_id' => $tenant->id,
            'name' => 'Sucursal Norte',
        ]);
    }

    public function test_member_cannot_create_branch(): void
    {
        [$tenant] = $this->makeOwnerTenant();
        $member = $this->makeMemberWithBranch($tenant, null);
        Sanctum::actingAs($member);

        $this->postJson('/api/branches', ['name' => 'X'])
            ->assertForbidden();
    }

    public function test_owner_cannot_create_branch_with_duplicate_name(): void
    {
        [$tenant, $owner] = $this->makeOwnerTenant();
        Branch::create(['tenant_id' => $tenant->id, 'name' => 'Norte']);

        Sanctum::actingAs($owner);

        $this->postJson('/api/branches', ['name' => 'Norte'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_delete_branch_with_assigned_users_is_blocked(): void
    {
        [$tenant, $owner] = $this->makeOwnerTenant();
        $branch = Branch::create(['tenant_id' => $tenant->id, 'name' => 'Norte']);
        User::factory()->create(['tenant_id' => $tenant->id, 'branch_id' => $branch->id]);

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/branches/{$branch->id}")
            ->assertStatus(422);

        $this->assertDatabaseHas('branches', ['id' => $branch->id]);
    }

    /**
     * @return array{0: Tenant, 1: User}
     */
    private function makeOwnerTenant(): array
    {
        $tenant = Tenant::create(['name' => 'Acme']);
        app(RoleProvisioner::class)->provisionDefaultRoles($tenant);
        $user = User::factory()->create(['tenant_id' => $tenant->id]);
        app(PermissionRegistrar::class)->setPermissionsTeamId($tenant->id);
        $user->syncRoles(['Owner']);

        return [$tenant, $user];
    }

    private function makeMemberWithBranch(Tenant $tenant, ?int $branchId): User
    {
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'branch_id' => $branchId,
        ]);
        app(PermissionRegistrar::class)->setPermissionsTeamId($tenant->id);
        $user->syncRoles(['Member']);

        return $user;
    }
}
