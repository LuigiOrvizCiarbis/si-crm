<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Enums\SenderType;
use App\Enums\MessageDirection;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Message extends Model
{
    protected $fillable = [
        'tenant_id',
        'conversation_id',
        'sender_type',
        'sender_id',
        'content',
        'direction',
        'external_id',
        'delivered_at',
        'read_at',
    ];

    protected $casts = [
        'sender_type' => SenderType::class,
        'direction' => MessageDirection::class,
        'delivered_at' => 'datetime',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function sender(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Relación con tenant
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Relación con conversation
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }


    /**
     * Scope para mensajes entrantes
     */
    public function scopeInbound($query)
    {
        return $query->where('direction', MessageDirection::INBOUND);
    }

    /**
     * Scope para mensajes salientes
     */
    public function scopeOutbound($query)
    {
        return $query->where('direction', MessageDirection::OUTBOUND);
    }

    /**
     * Scope para mensajes entregados
     */
    public function scopeDelivered($query)
    {
        return $query->whereNotNull('delivered_at');
    }

    /**
     * Scope para mensajes leídos
     */
    public function scopeRead($query)
    {
        return $query->whereNotNull('read_at');
    }

    /**
     * Marcar mensaje como entregado
     */
    public function markAsDelivered(): void
    {
        $this->update(['delivered_at' => now()]);
    }

    /**
     * Marcar mensaje como leído
     */
    public function markAsRead(): void
    {
        $this->update(['read_at' => now()]);
    }

    /**
     * Verificar si el mensaje fue entregado
     */
    public function isDelivered(): bool
    {
        return !is_null($this->delivered_at);
    }

    /**
     * Verificar si el mensaje fue leído
     */
    public function isRead(): bool
    {
        return !is_null($this->read_at);
    }
}
