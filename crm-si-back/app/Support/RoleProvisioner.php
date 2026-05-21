<?php

namespace App\Support;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleProvisioner
{
    public function __construct(private PermissionRegistrar $registrar) {}

    /**
     * Create the two immutable system roles (Owner, Admin) for the given tenant.
     * Idempotent: re-running on an already-provisioned tenant is a no-op.
     */
    public function provisionDefaultRoles(Tenant $tenant): void
    {
        // Permissions are global (team-agnostic). Ensure the catalog exists before
        // syncing roles so a fresh deploy without PermissionSeeder doesn't break
        // workspace registration.
        $this->ensurePermissionsExist();

        DB::transaction(function () use ($tenant): void {
            $this->registrar->setPermissionsTeamId($tenant->id);

            $owner = Role::firstOrCreate(
                ['name' => 'Owner', 'guard_name' => 'web', 'tenant_id' => $tenant->id],
                ['is_system' => true],
            );
            if (! $owner->is_system) {
                $owner->forceFill(['is_system' => true])->save();
            }
            $owner->syncPermissions(PermissionCatalog::ownerPermissions());

            $admin = Role::firstOrCreate(
                ['name' => 'Admin', 'guard_name' => 'web', 'tenant_id' => $tenant->id],
                ['is_system' => true],
            );
            if (! $admin->is_system) {
                $admin->forceFill(['is_system' => true])->save();
            }
            $admin->syncPermissions(PermissionCatalog::adminPermissions());

            $member = Role::firstOrCreate(
                ['name' => 'Member', 'guard_name' => 'web', 'tenant_id' => $tenant->id],
                ['is_system' => true],
            );
            if (! $member->is_system) {
                $member->forceFill(['is_system' => true])->save();
            }
            $member->syncPermissions(PermissionCatalog::memberPermissions());
        });

        $this->registrar->forgetCachedPermissions();
    }

    private function ensurePermissionsExist(): void
    {
        $this->registrar->setPermissionsTeamId(null);

        $created = false;
        foreach (PermissionCatalog::all() as $name) {
            $permission = Permission::where('name', $name)->where('guard_name', 'web')->first();
            if ($permission === null) {
                Permission::create(['name' => $name, 'guard_name' => 'web']);
                $created = true;
            }
        }

        if ($created) {
            $this->registrar->forgetCachedPermissions();
        }
    }
}
