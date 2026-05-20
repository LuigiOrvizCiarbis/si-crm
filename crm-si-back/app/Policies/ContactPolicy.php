<?php

namespace App\Policies;

use App\Models\Contact;
use App\Models\User;

class ContactPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('contacts.view_any')
            || $user->can('contacts.view_assigned');
    }

    public function view(User $user, Contact $contact): bool
    {
        if ($user->can('contacts.view_any')) {
            return true;
        }

        if (! $user->can('contacts.view_assigned')) {
            return false;
        }

        return $this->isAssigned($user, $contact);
    }

    public function create(User $user): bool
    {
        return $user->can('contacts.create');
    }

    public function update(User $user, Contact $contact): bool
    {
        return $user->can('contacts.update')
            && ($user->can('contacts.view_any') || $this->isAssigned($user, $contact));
    }

    public function delete(User $user, Contact $contact): bool
    {
        return $user->can('contacts.delete')
            && ($user->can('contacts.view_any') || $this->isAssigned($user, $contact));
    }

    public function import(User $user): bool
    {
        return $user->can('contacts.import');
    }

    public function viewHistory(User $user, Contact $contact): bool
    {
        return $user->can('contacts.view_history') && $this->view($user, $contact);
    }

    private function isAssigned(User $user, Contact $contact): bool
    {
        return $contact->conversations()->where('assigned_to', $user->id)->exists()
            || $contact->opportunities()->where('assigned_to', $user->id)->exists();
    }
}
