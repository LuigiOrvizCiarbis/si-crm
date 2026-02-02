<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant; // Tu trait de multi-tenancy
use Illuminate\Database\Eloquent\Relations\HasMany;

class PipelineStage extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'sort_order',
        'is_default'
    ];

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }
}
