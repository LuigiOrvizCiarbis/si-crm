<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('tasks.view_any') || $user->can('tasks.view_assigned');
    }

    public function view(User $user, Task $task): bool
    {
        if ($user->can('tasks.view_any')) {
            return true;
        }

        if (! $user->can('tasks.view_assigned')) {
            return false;
        }

        return $this->isOwn($user, $task);
    }

    public function create(User $user): bool
    {
        return $user->can('tasks.create');
    }

    public function update(User $user, Task $task): bool
    {
        if (! $user->can('tasks.update')) {
            return false;
        }

        if ($user->can('tasks.update_any')) {
            return true;
        }

        return $this->isOwn($user, $task);
    }

    public function delete(User $user, Task $task): bool
    {
        if (! $user->can('tasks.delete')) {
            return false;
        }

        if ($user->can('tasks.delete_any')) {
            return true;
        }

        return $this->isOwn($user, $task);
    }

    public function assign(User $user, Task $task): bool
    {
        return $user->can('tasks.assign');
    }

    private function isOwn(User $user, Task $task): bool
    {
        return (int) $task->assigned_to === (int) $user->id
            || (int) ($task->created_by ?? 0) === (int) $user->id;
    }
}
