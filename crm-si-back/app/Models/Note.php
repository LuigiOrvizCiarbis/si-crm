<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Database\Factories\NoteFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Note extends Model
{
    use BelongsToTenant;

    /** @use HasFactory<NoteFactory> */
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'contact_id',
        'conversation_id',
        'created_by',
        'body',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
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

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        return $query->where(function (Builder $query) use ($user) {
            $query->whereHas(
                'contact',
                fn (Builder $contactQuery) => $contactQuery->visibleTo($user),
            )->orWhereHas(
                'conversation',
                fn (Builder $conversationQuery) => $conversationQuery->visibleTo($user),
            );
        });
    }
}
