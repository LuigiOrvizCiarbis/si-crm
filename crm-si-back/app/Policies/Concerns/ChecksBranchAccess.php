<?php

namespace App\Policies\Concerns;

use App\Models\User;

trait ChecksBranchAccess
{
    protected function passesBranchCheck(User $user, mixed $resource): bool
    {
        if (! property_exists($resource, 'branch_id') && ! isset($resource->branch_id)) {
            return true;
        }

        if (is_null($user->branch_id) || is_null($resource->branch_id)) {
            return true;
        }

        if ($user->can('branches.view_all')) {
            return true;
        }

        return (int) $user->branch_id === (int) $resource->branch_id;
    }
}
