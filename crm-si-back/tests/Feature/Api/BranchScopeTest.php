<?php

namespace Tests\Feature\Api;

use App\Models\Branch;
use App\Models\Contact;
use App\Models\Tenant;
use App\Models\User;
use App\Support\RoleProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class BranchScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_sees_all_contacts_regardless_of_branch(): void
    {
        [$tenant, $owner] = $this->makeOwnerTenant();
        $north = Branch::create(['tenant_id' => $tenant->id, 'name' => 'North']);
        $south = Branch::create(['tenant_id' => $tenant->id, 'name' => 'South']);

        Contact::create(['tenant_id' => $tenant->id, 'branch_id' => $north->id, 'name' => 'A', 'source' => 'manual']);
        Contact::create(['tenant_id' => $tenant->id, 'branch_id' => $south->id, 'name' => 'B', 'source' => 'manual']);
        Contact::create(['tenant_id' => $tenant->id, 'branch_id' => null, 'name' => 'C', 'source' => 'manual']);

        $this->actingAs($owner);

        $this->assertSame(3, Contact::query()->count());
    }

    public function test_member_with_branch_sees_only_own_branch_plus_null(): void
    {
        [$tenant] = $this->makeOwnerTenant();
        $north = Branch::create(['tenant_id' => $tenant->id, 'name' => 'North']);
        $south = Branch::create(['tenant_id' => $tenant->id, 'name' => 'South']);

        Contact::create(['tenant_id' => $tenant->id, 'branch_id' => $north->id, 'name' => 'A', 'source' => 'manual']);
        Contact::create(['tenant_id' => $tenant->id, 'branch_id' => $south->id, 'name' => 'B', 'source' => 'manual']);
        Contact::create(['tenant_id' => $tenant->id, 'branch_id' => null, 'name' => 'C', 'source' => 'manual']);

        $member = $this->makeMemberWithBranch($tenant, $north->id);
        $this->actingAs($member);

        $names = Contact::query()->pluck('name')->sort()->values()->all();
        $this->assertSame(['A', 'C'], $names);
    }

    public function test_member_without_branch_sees_all_in_tenant(): void
    {
        [$tenant] = $this->makeOwnerTenant();
        $north = Branch::create(['tenant_id' => $tenant->id, 'name' => 'North']);

        Contact::create(['tenant_id' => $tenant->id, 'branch_id' => $north->id, 'name' => 'A', 'source' => 'manual']);
        Contact::create(['tenant_id' => $tenant->id, 'branch_id' => null, 'name' => 'B', 'source' => 'manual']);

        $member = $this->makeMemberWithBranch($tenant, null);
        $this->actingAs($member);

        $this->assertSame(2, Contact::query()->count());
    }

    public function test_zero_branch_tenant_preserves_current_behavior(): void
    {
        [$tenant] = $this->makeOwnerTenant();

        Contact::create(['tenant_id' => $tenant->id, 'name' => 'A', 'source' => 'manual']);
        Contact::create(['tenant_id' => $tenant->id, 'name' => 'B', 'source' => 'manual']);

        $member = $this->makeMemberWithBranch($tenant, null);
        $this->actingAs($member);

        $this->assertSame(2, Contact::query()->count());
        $this->assertSame(0, Branch::query()->count());
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
