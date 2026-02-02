<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    protected $fillable = [
        'name',
        'plan',
        'timezone',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relación con channels
     */
    public function channels(): HasMany
    {
        return $this->hasMany(Channel::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Relación con contacts
     */
    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class);
    }

    /**
     * Relación con conversations
     */
    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    /**
     * Relación con messages
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Scope para plan específico
     */
    public function scopePlan($query, string $plan)
    {
        return $query->where('plan', $plan);
    }

    /**
     * Verificar si es plan free
     */
    public function isFreePlan(): bool
    {
        return $this->plan === 'free';
    }

    /**
     * Verificar si es plan pro
     */
    public function isProPlan(): bool
    {
        return $this->plan === 'pro';
    }

    /**
     * Verificar si es plan enterprise
     */
    public function isEnterprisePlan(): bool
    {
        return $this->plan === 'enterprise';
    }
}
