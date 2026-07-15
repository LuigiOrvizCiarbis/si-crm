<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Endpoint de webhook entrante configurable por tenant. El sistema externo del
 * cliente hace POST a la URL pública con su API key; la plataforma hace upsert
 * idempotente en la tabla destino (v1: contacts, source='webhook').
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $name
 * @property string $slug
 * @property string $target
 * @property string $api_key_prefix
 * @property bool $enabled
 * @property ?Carbon $last_received_at
 */
class WebhookEndpoint extends Model
{
    use BelongsToTenant;

    protected $table = 'webhook_endpoints';

    // api_key_hash/api_key_prefix/signing_secret NO van acá a propósito: la key se
    // setea vía setApiKey() (hashea) y el secret vía setEncryptedSigningSecret()
    // (encripta). Dejarlos fillable permitiría guardarlos en plano por create()/fill().
    protected $fillable = [
        'tenant_id',
        'name',
        'slug',
        'target',
        'enabled',
        'last_received_at',
    ];

    protected $hidden = [
        'api_key_hash',
        'api_key_prefix',
        'signing_secret',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'last_received_at' => 'datetime',
        ];
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(WebhookDelivery::class);
    }

    /**
     * Genera una API key en plano de alta entropía. El prefijo whk_ la identifica
     * como key de webhook entrante.
     */
    public static function generateApiKey(): string
    {
        return 'whk_'.Str::random(40);
    }

    /**
     * Setea la key: persiste el hash sha256 (para lookup) y el prefijo visible.
     * El valor en plano nunca se guarda; el caller lo devuelve una única vez.
     */
    public function setApiKey(string $plain): void
    {
        $this->api_key_hash = hash('sha256', $plain);
        $this->api_key_prefix = Str::substr($plain, 0, 12);
    }

    public function hasSigningSecret(): bool
    {
        return ! empty($this->signing_secret);
    }

    public function setEncryptedSigningSecret(string $value): void
    {
        $this->signing_secret = Crypt::encryptString($value);
    }

    public function getDecryptedSigningSecret(): ?string
    {
        if (! $this->signing_secret) {
            return null;
        }

        try {
            return Crypt::decryptString($this->signing_secret);
        } catch (\Exception $e) {
            Log::error('Error decrypting webhook signing secret for endpoint '.$this->id, [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    public function getPublicUrlAttribute(): string
    {
        return rtrim(config('app.url'), '/').'/api/incoming-webhooks/'.$this->slug;
    }
}
