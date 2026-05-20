<?php

namespace App\Policies;

use App\Models\PipelineStage;
use App\Models\User;

class PipelineStagePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('pipeline_stages.view');
    }

    public function view(User $user, PipelineStage $stage): bool
    {
        return $user->can('pipeline_stages.view');
    }

    public function create(User $user): bool
    {
        return $user->can('pipeline_stages.manage');
    }

    public function update(User $user, PipelineStage $stage): bool
    {
        return $user->can('pipeline_stages.manage');
    }

    public function delete(User $user, PipelineStage $stage): bool
    {
        return $user->can('pipeline_stages.manage');
    }

    public function reorder(User $user): bool
    {
        return $user->can('pipeline_stages.manage');
    }
}
