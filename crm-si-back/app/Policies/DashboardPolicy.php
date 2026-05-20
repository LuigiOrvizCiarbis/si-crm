<?php

namespace App\Policies;

use App\Models\User;

class DashboardPolicy
{
    public function view(User $user): bool
    {
        return $user->can('analytics.view');
    }

    public function viewTeam(User $user): bool
    {
        return $user->can('analytics.view_team');
    }
}
