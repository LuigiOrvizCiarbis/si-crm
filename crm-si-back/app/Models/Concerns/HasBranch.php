<?php

namespace App\Models\Concerns;

use App\Models\Branch;
use App\Models\Scopes\BranchScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

trait HasBranch
{
    protected static function bootHasBranch(): void
    {
        static::addGlobalScope(new BranchScope);

        static::creating(function ($model) {
            if (! is_null($model->branch_id)) {
                return;
            }

            if (! Auth::check()) {
                return;
            }

            $user = Auth::user();

            if ($user->isTenantOwner()) {
                return;
            }

            if (is_null($user->branch_id)) {
                return;
            }

            $model->branch_id = $user->branch_id;
        });
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
