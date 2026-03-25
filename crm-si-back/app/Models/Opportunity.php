<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Opportunity extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'contact_id',
        'conversation_id',
        'pipeline_stage_id',
        'assigned_to',
        'title',
        'status',
        'source_type',
        'value',
        'notes',
        'last_activity_at',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'last_activity_at' => 'datetime',
        ];
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function pipelineStage(): BelongsTo
    {
        return $this->belongsTo(PipelineStage::class, 'pipeline_stage_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
