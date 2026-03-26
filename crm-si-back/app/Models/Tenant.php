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

    protected static function booted(): void
    {
        static::created(function (Tenant $tenant) {
            $now = now();
            $stages = [
                ['name' => 'Capturados', 'sort_order' => 1, 'is_default' => true],
                ['name' => 'Calificados', 'sort_order' => 2, 'is_default' => false],
                ['name' => 'Negociación', 'sort_order' => 3, 'is_default' => false],
                ['name' => 'Cierre', 'sort_order' => 4, 'is_default' => false],
                ['name' => 'Ganado', 'sort_order' => 5, 'is_default' => false],
                ['name' => 'Perdido', 'sort_order' => 6, 'is_default' => false],
            ];

            PipelineStage::insert(array_map(fn ($stage) => [
                ...$stage,
                'tenant_id' => $tenant->id,
                'created_at' => $now,
                'updated_at' => $now,
            ], $stages));
        });
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class);
    }

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
