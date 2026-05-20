<?php

namespace App\Policies;

use App\Models\Tag;
use App\Models\User;

class TagPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('tags.view');
    }

    public function view(User $user, Tag $tag): bool
    {
        return $user->can('tags.view');
    }

    public function create(User $user): bool
    {
        return $user->can('tags.manage');
    }

    public function update(User $user, Tag $tag): bool
    {
        return $user->can('tags.manage');
    }

    public function delete(User $user, Tag $tag): bool
    {
        return $user->can('tags.manage');
    }

    public function attach(User $user): bool
    {
        return $user->can('tags.attach');
    }
}
