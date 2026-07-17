<?php

use App\Models\Tenant;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    private const PERMISSION = 'templates.delete';

    public function up(): void
    {
        /** @var PermissionRegistrar $registrar */
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId(null);
        $registrar->forgetCachedPermissions();

        $permission = Permission::findOrCreate(self::PERMISSION, 'web');

        Tenant::query()->select(['id', 'owner_role_id'])->each(function (Tenant $tenant) use ($permission, $registrar): void {
            $registrar->setPermissionsTeamId($tenant->id);

            Role::query()
                ->where('tenant_id', $tenant->id)
                ->where(function ($query) use ($tenant): void {
                    $query->where('name', 'Admin')
                        ->orWhere('id', $tenant->owner_role_id);
                })
                ->get()
                ->each(fn (Role $role) => $role->givePermissionTo($permission));
        });

        $registrar->setPermissionsTeamId(null);
        $registrar->forgetCachedPermissions();
    }

    public function down(): void
    {
        /** @var PermissionRegistrar $registrar */
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId(null);
        $permission = Permission::query()
            ->where('name', self::PERMISSION)
            ->where('guard_name', 'web')
            ->first();

        if (! $permission) {
            return;
        }

        Tenant::query()->select(['id', 'owner_role_id'])->each(function (Tenant $tenant) use ($permission, $registrar): void {
            $registrar->setPermissionsTeamId($tenant->id);
            Role::query()
                ->where('tenant_id', $tenant->id)
                ->where(function ($query) use ($tenant): void {
                    $query->where('name', 'Admin')
                        ->orWhere('id', $tenant->owner_role_id);
                })
                ->get()
                ->each(fn (Role $role) => $role->revokePermissionTo($permission));
        });

        $registrar->setPermissionsTeamId(null);
        if (! DB::table('role_has_permissions')->where('permission_id', $permission->id)->exists()) {
            $permission->delete();
        }
        $registrar->forgetCachedPermissions();
    }
};
