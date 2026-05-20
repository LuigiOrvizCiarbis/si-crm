<?php

namespace App\Policies;

use App\Models\Invitation;
use App\Models\User;

class InvitationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('invitations.view');
    }

    public function view(User $user, Invitation $invitation): bool
    {
        return $user->can('invitations.view')
            && (int) $invitation->tenant_id === (int) $user->tenant_id;
    }

    public function create(User $user): bool
    {
        return $user->can('invitations.create');
    }

    public function delete(User $user, Invitation $invitation): bool
    {
        return $user->can('invitations.revoke')
            && (int) $invitation->tenant_id === (int) $user->tenant_id;
    }
}
