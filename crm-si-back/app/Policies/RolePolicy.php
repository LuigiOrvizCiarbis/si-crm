<?php

namespace App\Policies;

use App\Models\Tenant;
use App\Models\User;
use Spatie\Permission\Models\Role;

class RolePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('roles.view');
    }

    public function view(User $user, Role $role): bool
    {
        return $user->can('roles.view')
            && (int) ($role->tenant_id ?? 0) === (int) $user->tenant_id;
    }

    public function create(User $user): bool
    {
        return $user->can('roles.manage');
    }

    public function update(User $user, Role $role): bool
    {
        if (! $user->can('roles.manage')) {
            return false;
        }

        if ((int) ($role->tenant_id ?? 0) !== (int) $user->tenant_id) {
            return false;
        }

        if ($this->isOwnerRole($role)) {
            return false;
        }

        // System roles are protected from edits via the normal flow.
        // Owner bypasses through Gate::before; everyone else cannot touch them.
        return ! $role->is_system;
    }

    public function delete(User $user, Role $role): bool
    {
        if (! $user->can('roles.manage')) {
            return false;
        }

        if ((int) ($role->tenant_id ?? 0) !== (int) $user->tenant_id) {
            return false;
        }

        if ($this->isOwnerRole($role)) {
            return false;
        }

        return ! $role->is_system;
    }

    /**
     * The tenant's Owner role is immutable: it cannot be renamed or deleted,
     * not even by an Owner. This guarantees the Gate::before bypass keeps
     * working and keeps at least one role with full permissions in the tenant.
     */
    private function isOwnerRole(Role $role): bool
    {
        $tenantId = $role->tenant_id;
        if ($tenantId === null) {
            return false;
        }

        $ownerRoleId = Tenant::query()->whereKey($tenantId)->value('owner_role_id');

        return $ownerRoleId !== null && (int) $ownerRoleId === (int) $role->id;
    }

    public function syncPermissions(User $user, Role $role): bool
    {
        return $this->update($user, $role);
    }
}
