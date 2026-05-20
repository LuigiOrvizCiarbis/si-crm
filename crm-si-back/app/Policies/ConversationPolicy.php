<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\User;

class ConversationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('conversations.view_any')
            || $user->can('conversations.view_assigned');
    }

    public function view(User $user, Conversation $conversation): bool
    {
        if ($user->can('conversations.view_any')) {
            return true;
        }

        if (! $user->can('conversations.view_assigned')) {
            return false;
        }

        return $this->isAssigned($user, $conversation);
    }

    public function update(User $user, Conversation $conversation): bool
    {
        return $user->can('conversations.update') && $this->canTouch($user, $conversation);
    }

    public function delete(User $user, Conversation $conversation): bool
    {
        return $user->can('conversations.delete') && $this->canTouch($user, $conversation);
    }

    public function assign(User $user, Conversation $conversation): bool
    {
        return $user->can('conversations.assign') && $this->canTouch($user, $conversation);
    }

    public function changeStage(User $user, Conversation $conversation): bool
    {
        return $user->can('conversations.change_stage') && $this->canTouch($user, $conversation);
    }

    public function sendMessage(User $user, Conversation $conversation): bool
    {
        return $user->can('conversations.send_message') && $this->canTouch($user, $conversation);
    }

    private function canTouch(User $user, Conversation $conversation): bool
    {
        return $user->can('conversations.view_any') || $this->isAssigned($user, $conversation);
    }

    private function isAssigned(User $user, Conversation $conversation): bool
    {
        if ((int) $conversation->assigned_to === (int) $user->id) {
            return true;
        }

        if ($conversation->relationLoaded('users')) {
            if ($conversation->users->contains('id', $user->id)) {
                return true;
            }
        } elseif ($conversation->users()->where('users.id', $user->id)->exists()) {
            return true;
        }

        return in_array((int) $conversation->channel_id, $user->accessibleChannelIds(), true);
    }
}
