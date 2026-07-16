<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WhatsAppTemplate;

class WhatsAppTemplatePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('templates.view');
    }

    public function view(User $user, WhatsAppTemplate $template): bool
    {
        return $user->can('templates.view');
    }

    public function sync(User $user): bool
    {
        return $user->can('templates.sync');
    }

    public function create(User $user): bool
    {
        return $user->can('templates.create');
    }

    public function send(User $user): bool
    {
        return $user->can('templates.send');
    }
}
