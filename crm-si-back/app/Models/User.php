<?php

namespace App\Models;

use App\Notifications\CustomVerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, BelongsToTenant;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'tenant_id'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Send the email verification notification.
     */
    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new CustomVerifyEmail);
    }

    /**
     * Relación con channels (dueño principal)
     */
    public function ownedChannels(): HasMany
    {
        return $this->hasMany(Channel::class);
    }

    /**
     * Relación many-to-many con canales a los que tiene acceso
     */
    public function channels(): BelongsToMany
    {
        return $this->belongsToMany(Channel::class, 'channel_user')
            ->withTimestamps();
    }

    /**
     * Obtener todos los canales accesibles (propios + asignados)
     */
    public function accessibleChannelIds(): array
    {
        $ownedIds = $this->ownedChannels()->pluck('id')->toArray();
        $assignedIds = $this->channels()->pluck('channels.id')->toArray();
        return array_unique(array_merge($ownedIds, $assignedIds));
    }

    /**
     * Relación con conversations asignadas (responsable principal)
     */
    public function assignedConversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'assigned_to');
    }

    /**
     * Relación many-to-many con conversations (todas las asignadas/derivadas)
     */
    public function conversations(): BelongsToMany
    {
        return $this->belongsToMany(Conversation::class, 'conversation_user')
            ->withPivot('assigned_by')
            ->withTimestamps();
    }

    /**
     * Relación con messages enviados
     */
    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

     public function tenants(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

     public function messages(): MorphMany
    {
        return $this->morphMany(Message::class, 'sender');
    }
}
