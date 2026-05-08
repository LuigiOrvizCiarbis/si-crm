<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\HasTags;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * @property int $id
 * @property int $tenant_id
 * @property string $name
 * @property string|null $phone
 * @property string|null $email
 * @property string|null $external_id
 * @property string|null $source
 */
class Contact extends Model
{
    use BelongsToTenant;
    use HasTags;

    protected $fillable = [
        'tenant_id',
        'name',
        'phone',
        'email',
        'external_id',
        'source',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    public function opportunities(): HasMany
    {
        return $this->hasMany(Opportunity::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function scopeFromSource($query, string $source)
    {
        return $query->where('source', $source);
    }

    public function scopeWithEmail($query)
    {
        return $query->whereNotNull('email');
    }

    public function scopeWithPhone($query)
    {
        return $query->whereNotNull('phone');
    }

    public function activeConversation()
    {
        return $this->conversations()->where('status', 'open')->latest()->first();
    }

    public function hasEmail(): bool
    {
        return !is_null($this->email);
    }

    public function hasPhone(): bool
    {
        return !is_null($this->phone);
    }

    public function getDisplayNameAttribute(): string
    {
        return $this->name ?: $this->phone ?: $this->email ?: 'Sin nombre';
    }

    public function messages(): MorphMany
    {
        return $this->morphMany(Message::class, 'sender');
    }
}
