<?php

namespace App\Models;

use App\Enums\ContactFieldType;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

/**
 * @property int $id
 * @property int $tenant_id
 * @property string $key
 * @property string $label
 * @property ContactFieldType $type
 * @property array<string, mixed>|null $options
 * @property bool $is_required
 * @property bool $is_unique
 * @property int $display_order
 */
class ProductField extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'key',
        'label',
        'type',
        'options',
        'is_required',
        'is_unique',
        'display_order',
    ];

    /**
     * Per-request memo cache so the same tenant's schema is loaded once.
     *
     * @var array<int, Collection<int, self>>
     */
    protected static array $tenantCache = [];

    protected function casts(): array
    {
        return [
            'type' => ContactFieldType::class,
            'options' => 'array',
            'is_required' => 'boolean',
            'is_unique' => 'boolean',
            'display_order' => 'integer',
        ];
    }

    /**
     * @return Collection<int, self>
     */
    public static function forCurrentTenant(): Collection
    {
        $tenantId = Auth::user()?->tenant_id;

        if (! $tenantId) {
            return new Collection;
        }

        return self::forTenant($tenantId);
    }

    /**
     * @return Collection<int, self>
     */
    public static function forTenant(int $tenantId): Collection
    {
        if (! isset(self::$tenantCache[$tenantId])) {
            self::$tenantCache[$tenantId] = self::query()
                ->where('tenant_id', $tenantId)
                ->orderBy('display_order')
                ->orderBy('id')
                ->get();
        }

        return self::$tenantCache[$tenantId];
    }

    public static function clearTenantCache(?int $tenantId = null): void
    {
        if ($tenantId === null) {
            self::$tenantCache = [];

            return;
        }

        unset(self::$tenantCache[$tenantId]);
    }

    protected static function booted(): void
    {
        $invalidate = function (self $model): void {
            self::clearTenantCache($model->tenant_id);
        };

        self::created($invalidate);
        self::updated($invalidate);
        self::deleted($invalidate);
        self::restored($invalidate);
    }
}
