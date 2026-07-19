<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class WhatsAppConfig extends Model
{
    protected $table = 'whatsapp_configs';

    protected $fillable = [
        'phone_number_id',
        'phone_number',
        'display_phone_number',
        'waba_id',
        'business_id',
        'quality_rating',
        'webhook_url',
        'verify_token',
        'bussines_token',
        'registration_pin',
        'ai_autoreply_default',
        'ai_system_prompt',
    ];

    protected $casts = [
        'ai_autoreply_default' => 'boolean',
    ];

    protected $hidden = [
        'bussines_token',
        'registration_pin',
    ];

    /**
     * Relación con Channels (una config puede pertenecer a varios canales)
     */
    public function channels(): HasMany
    {
        return $this->hasMany(Channel::class, 'whatsapp_config_id');
    }

    /**
     * Relación con WhatsApp Templates
     */
    public function templates(): HasMany
    {
        return $this->hasMany(WhatsAppTemplate::class);
    }

    public function getDecryptedToken(): ?string
    {
        if (! $this->bussines_token) {
            return null;
        }

        try {
            return Crypt::decryptString($this->bussines_token);
        } catch (\Exception $e) {
            Log::error('Error decrypting token for channel '.$this->id, [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Establecer el access token encriptado
     */
    public function setEncryptedToken(string $token): void
    {
        $this->bussines_token = Crypt::encryptString($token);
        $this->save();
    }

    public function getDecryptedRegistrationPin(): ?string
    {
        if (! $this->registration_pin) {
            return null;
        }

        try {
            return Crypt::decryptString($this->registration_pin);
        } catch (\Exception $e) {
            Log::error('Error decrypting registration pin for config '.$this->id, [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Establecer el PIN de registro (two-step verification) encriptado
     */
    public function setEncryptedRegistrationPin(string $pin): void
    {
        $this->registration_pin = Crypt::encryptString($pin);
        $this->save();
    }
}
