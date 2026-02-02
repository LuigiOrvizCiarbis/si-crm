<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{

    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'channel_id',
        'contact_id',
        'assigned_to',
        'status',
        'last_message_at',
        'last_message_content',
        'pipeline_stage_id'
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
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
     * Relación con channel
     */
    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    /**
     * Relación con contact
     */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    /**
     * Relación con usuario asignado (responsable principal)
     */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Relación many-to-many con usuarios asignados/derivados
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conversation_user')
            ->withPivot('assigned_by')
            ->withTimestamps();
    }

    /**
     * Relación con messages
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Scope para conversaciones abiertas
     */
    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    /**
     * Scope para conversaciones cerradas
     */
    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }

    /**
     * Scope para conversaciones pendientes
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope para conversaciones asignadas a un usuario
     */
    public function scopeAssignedTo($query, int $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    /**
     * Scope para conversaciones sin asignar
     */
    public function scopeUnassigned($query)
    {
        return $query->whereNull('assigned_to');
    }

    /**
     * Obtener el último mensaje
     */
    public function lastMessage(): ?Message
    {
        return $this->messages()->latest()->first();
    }



    /**
     * Asignar a un usuario
     */
    public function assignTo(int $userId): void
    {
        $this->update(['assigned_to' => $userId]);
    }

    /**
     * Desasignar usuario
     */
    public function unassign(): void
    {
        $this->update(['assigned_to' => null]);
    }

    /**
     * Cerrar conversación
     */
    public function close(): void
    {
        $this->update(['status' => 'closed']);
    }

    /**
     * Abrir conversación
     */
    public function open(): void
    {
        $this->update(['status' => 'open']);
    }

    /**
     * Marcar como pendiente
     */
    public function markAsPending(): void
    {
        $this->update(['status' => 'pending']);
    }

    /**
     * Actualizar timestamp del último mensaje
     */
    public function updateLastMessageAt(): void
    {
        $this->update(['last_message_at' => now()]);
    }

    /**
     * Verificar si está abierta
     */
    public function isOpen(): bool
    {
        return $this->status === 'open';
    }

    /**
     * Verificar si está cerrada
     */
    public function isClosed(): bool
    {
        return $this->status === 'closed';
    }

    /**
     * Verificar si está asignada
     */
    public function isAssigned(): bool
    {
        return !is_null($this->assigned_to);
    }

    public function pipelineStage(): BelongsTo
    {
        return $this->belongsTo(PipelineStage::class);
    }
}
