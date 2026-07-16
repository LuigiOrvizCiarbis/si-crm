<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class GoogleCalendarConnection extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'google_email',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'scopes',
        'status',
    ];

    protected $hidden = [
        'access_token',
        'refresh_token',
    ];

    protected function casts(): array
    {
        return [
            'token_expires_at' => 'datetime',
            'scopes' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getDecryptedAccessToken(): ?string
    {
        return $this->decrypt($this->access_token);
    }

    public function getDecryptedRefreshToken(): ?string
    {
        return $this->decrypt($this->refresh_token);
    }

    public function setEncryptedAccessToken(string $token): void
    {
        $this->access_token = Crypt::encryptString($token);
    }

    public function setEncryptedRefreshToken(string $token): void
    {
        $this->refresh_token = Crypt::encryptString($token);
    }

    private function decrypt(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            Log::error('Error decrypting Google Calendar token for connection '.$this->id, [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
