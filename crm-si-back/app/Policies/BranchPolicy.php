<?php

namespace App\Policies;

use App\Models\Branch;
use App\Models\User;

class BranchPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('branches.view_any');
    }

    public function view(User $user, Branch $branch): bool
    {
        return $user->can('branches.view') && $branch->tenant_id === $user->tenant_id;
    }

    public function create(User $user): bool
    {
        return $user->can('branches.manage');
    }

    public function update(User $user, Branch $branch): bool
    {
        return $user->can('branches.manage') && $branch->tenant_id === $user->tenant_id;
    }

    public function delete(User $user, Branch $branch): bool
    {
        return $user->can('branches.manage') && $branch->tenant_id === $user->tenant_id;
    }

    public function viewStats(User $user, Branch $branch): bool
    {
        return ($user->can('branches.view_all') || $user->can('branches.manage'))
            && $branch->tenant_id === $user->tenant_id;
    }
}
