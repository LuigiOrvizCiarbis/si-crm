<?php

namespace App\Policies;

use App\Models\Opportunity;
use App\Models\User;

class OpportunityPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('opportunities.view_any')
            || $user->can('opportunities.view_assigned');
    }

    public function view(User $user, Opportunity $opportunity): bool
    {
        if ($user->can('opportunities.view_any')) {
            return true;
        }

        if (! $user->can('opportunities.view_assigned')) {
            return false;
        }

        return (int) $opportunity->assigned_to === (int) $user->id;
    }

    public function create(User $user): bool
    {
        return $user->can('opportunities.create');
    }

    public function update(User $user, Opportunity $opportunity): bool
    {
        return $user->can('opportunities.update') && $this->canTouch($user, $opportunity);
    }

    public function delete(User $user, Opportunity $opportunity): bool
    {
        return $user->can('opportunities.delete') && $this->canTouch($user, $opportunity);
    }

    public function assign(User $user, Opportunity $opportunity): bool
    {
        return $user->can('opportunities.assign') && $this->canTouch($user, $opportunity);
    }

    public function changeStage(User $user, Opportunity $opportunity): bool
    {
        return $user->can('opportunities.change_stage') && $this->canTouch($user, $opportunity);
    }

    public function viewSummary(User $user): bool
    {
        return $user->can('opportunities.view_summary');
    }

    private function canTouch(User $user, Opportunity $opportunity): bool
    {
        return $user->can('opportunities.view_any')
            || (int) $opportunity->assigned_to === (int) $user->id;
    }
}
