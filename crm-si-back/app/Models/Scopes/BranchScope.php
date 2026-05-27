<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class BranchScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        if (! Auth::check()) {
            return;
        }

        $user = Auth::user();

        if ($user->isTenantOwner()) {
            return;
        }

        if ($user->can('branches.view_all')) {
            return;
        }

        if (is_null($user->branch_id)) {
            return;
        }

        $table = $model->getTable();

        $builder->where(function (Builder $query) use ($table, $user) {
            $query->where($table.'.branch_id', $user->branch_id)
                ->orWhereNull($table.'.branch_id');
        });
    }
}
