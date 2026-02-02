<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use App\Enums\ChannelType;
use App\Models\Concerns\BelongsToTenant;

class Channel extends Model
{

    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'whatsapp_config_id',
        'type',
        'name',
        'external_id',
        'status'
    ];

    protected $casts = [
        'type' => ChannelType::class,
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
     * Relación con user (dueño principal)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación many-to-many con usuarios asignados al canal
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'channel_user')
            ->withTimestamps();
    }

    /**
     * Relación con conversations
     */
    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    /**
     * Relación con WhatsAppConfig (muchos canales pueden compartir una config)
     */
    public function whatsappConfig(): BelongsTo
    {
        return $this->belongsTo(WhatsAppConfig::class);
    }

    /**
     * Scope para canales activos
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope para canales desconectados
     */
    public function scopeDisconnected($query)
    {
        return $query->where('status', 'disconnected');
    }

    /**
     * Scope por tipo de canal
     */
    public function scopeOfType($query, ChannelType $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Verificar si el canal está activo
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Verificar si el canal está desconectado
     */
    public function isDisconnected(): bool
    {
        return $this->status === 'disconnected';
    }

    /**
     * Activar el canal
     */
    public function activate(): void
    {
        $this->update(['status' => 'active']);
    }

    /**
     * Desconectar el canal
     */
    public function disconnect(): void
    {
        $this->update(['status' => 'disconnected']);
    }
}
