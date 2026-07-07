<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

/**
 * Config de WooCommerce por tenant: URL de la tienda + Consumer Key/Secret de la
 * REST API (encriptados). Con estas credenciales se importan/sincronizan los
 * productos de la tienda al catálogo (source='woocommerce').
 *
 * @property string $store_url
 * @property bool $enabled
 * @property ?\Illuminate\Support\Carbon $last_synced_at
 */
class WooCommerceConfig extends Model
{
    use BelongsToTenant;

    protected $table = 'woocommerce_configs';

    // consumer_key/consumer_secret NO van acá a propósito: se escriben solo vía
    // setEncryptedConsumerKey/Secret (encriptan). Dejarlas fillable permitiría
    // guardarlas en plano por create()/fill()/update().
    protected $fillable = [
        'tenant_id',
        'store_url',
        'enabled',
        'last_synced_at',
    ];

    protected $hidden = [
        'consumer_key',
        'consumer_secret',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'last_synced_at' => 'datetime',
        ];
    }

    public function getDecryptedConsumerKey(): ?string
    {
        return $this->decrypt($this->consumer_key);
    }

    public function getDecryptedConsumerSecret(): ?string
    {
        return $this->decrypt($this->consumer_secret);
    }

    public function setEncryptedConsumerKey(string $value): void
    {
        $this->consumer_key = Crypt::encryptString($value);
    }

    public function setEncryptedConsumerSecret(string $value): void
    {
        $this->consumer_secret = Crypt::encryptString($value);
    }

    public function hasCredentials(): bool
    {
        return ! empty($this->consumer_key) && ! empty($this->consumer_secret);
    }

    /**
     * Desencripta un valor; loguea y devuelve null si falla (mismo criterio que AiConfig).
     */
    private function decrypt(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            Log::error('Error decrypting WooCommerce credential for tenant '.$this->tenant_id, [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
