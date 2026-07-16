<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskCalendarSync extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'task_id',
        'owner_user_id',
        'google_calendar_id',
        'external_event_id',
        'event_generation',
        'html_link',
        'meet_link',
        'status',
        'last_error',
        'synced_at',
    ];

    protected function casts(): array
    {
        return [
            'synced_at' => 'datetime',
        ];
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function ownerUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }
}
