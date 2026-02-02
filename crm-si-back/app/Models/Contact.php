<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Contact extends Model
{

        use BelongsToTenant;

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

    /**
     * Relación con tenant
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Relación con conversations
     */
    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    /**
     * Scope por fuente
     */
    public function scopeFromSource($query, string $source)
    {
        return $query->where('source', $source);
    }

    /**
     * Scope para contactos con email
     */
    public function scopeWithEmail($query)
    {
        return $query->whereNotNull('email');
    }

    /**
     * Scope para contactos con teléfono
     */
    public function scopeWithPhone($query)
    {
        return $query->whereNotNull('phone');
    }

    /**
     * Obtener conversación activa
     */
    public function activeConversation()
    {
        return $this->conversations()->where('status', 'open')->latest()->first();
    }

    /**
     * Verificar si tiene email
     */
    public function hasEmail(): bool
    {
        return !is_null($this->email);
    }

    /**
     * Verificar si tiene teléfono
     */
    public function hasPhone(): bool
    {
        return !is_null($this->phone);
    }

    /**
     * Obtener nombre completo o teléfono
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->name ?: $this->phone ?: $this->email ?: 'Sin nombre';
    }

    public function messages(): MorphMany
    {
        return $this->morphMany(Message::class, 'sender');
    }
}
