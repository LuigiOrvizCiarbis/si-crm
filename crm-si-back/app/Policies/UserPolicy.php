<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('users.view');
    }

    public function view(User $user, User $target): bool
    {
        return $user->can('users.view') && (int) $user->tenant_id === (int) $target->tenant_id;
    }

    public function update(User $user, User $target): bool
    {
        return $user->can('users.update') && (int) $user->tenant_id === (int) $target->tenant_id;
    }

    public function assignRole(User $user, User $target): bool
    {
        if (! $user->can('users.assign_role')) {
            return false;
        }

        if ((int) $user->tenant_id !== (int) $target->tenant_id) {
            return false;
        }

        // Only Owner (handled by Gate::before) may change another Owner's role.
        if ($target->hasRole('Owner') && ! $user->hasRole('Owner')) {
            return false;
        }

        return true;
    }

    public function deactivate(User $user, User $target): bool
    {
        if (! $user->can('users.deactivate')) {
            return false;
        }

        if ((int) $user->tenant_id !== (int) $target->tenant_id) {
            return false;
        }

        return ! $target->hasRole('Owner');
    }
}
