<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Validation\Rule;

class BranchRuleResolver
{
    /**
     * Build validation rules for a `branch_id` field that respect the actor's
     * branch privileges. Users with tenant-wide branch permissions can target
     * any branch in the tenant; branch-scoped users may only target their own
     * branch (null is always allowed so the HasBranch default can apply).
     *
     * @return array<int, mixed>
     */
    public static function rulesFor(?User $user, ?string $errorMessage = null): array
    {
        $rules = ['nullable', 'integer'];

        if ($user === null) {
            return $rules;
        }

        $tenantId = $user->tenant_id;

        if (self::hasCrossBranchPrivileges($user)) {
            $rules[] = Rule::exists('branches', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId));

            return $rules;
        }

        $allowedBranchId = $user->branch_id;
        $message = $errorMessage ?? __('No tienes permiso para asignar este recurso a esa sucursal.');

        $rules[] = function (string $attribute, $value, $fail) use ($allowedBranchId, $message): void {
            if ($value === null) {
                return;
            }

            if ($allowedBranchId === null || (int) $value !== (int) $allowedBranchId) {
                $fail($message);
            }
        };

        return $rules;
    }

    public static function hasCrossBranchPrivileges(User $user): bool
    {
        return $user->isTenantOwner()
            || $user->can('branches.view_all')
            || $user->can('branches.manage');
    }
}
