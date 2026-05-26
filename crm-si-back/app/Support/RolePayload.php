<?php

namespace App\Support;

use App\Models\Tenant;
use Spatie\Permission\Models\Role;

class RolePayload
{
    /**
     * Render a role into the canonical API payload, including the derived
     * is_owner flag so the frontend never has to compare names. Pass an
     * already-loaded tenant when possible to avoid an extra query per call.
     *
     * @return array{id:int,name:string,is_system:bool,is_owner:bool}|null
     */
    public static function transform(?Role $role, ?Tenant $tenant = null): ?array
    {
        if ($role === null) {
            return null;
        }

        $ownerRoleId = $tenant?->owner_role_id
            ?? Tenant::query()->whereKey($role->tenant_id)->value('owner_role_id');

        return [
            'id' => (int) $role->id,
            'name' => $role->name,
            'is_system' => (bool) $role->is_system,
            'is_owner' => $ownerRoleId !== null && (int) $ownerRoleId === (int) $role->id,
        ];
    }
}
