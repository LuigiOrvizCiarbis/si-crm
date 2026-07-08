<?php

namespace App\Support;

use App\Enums\ContactFieldType;
use App\Models\ProductField;
use App\Models\Tenant;

class ProductFieldProvisioner
{
    /**
     * Default catalogue fields seeded for every tenant. `name` stays fixed and
     * lives in ProductFieldRegistry::standard(); these are pre-seeded but remain
     * editable/deletable so the catalogue is transversal to any industry.
     *
     * @var list<array<string, mixed>>
     */
    private const DEFAULTS = [
        [
            'key' => 'price',
            'label' => 'Precio',
            'type' => ContactFieldType::Number,
            'display_order' => 0,
        ],
        [
            'key' => 'description',
            'label' => 'Descripción',
            'type' => ContactFieldType::Text,
            'display_order' => 1,
        ],
        [
            'key' => 'is_active',
            'label' => 'Activo',
            'type' => ContactFieldType::Boolean,
            'display_order' => 2,
        ],
    ];

    /**
     * Idempotently seed the default catalogue fields for a tenant. Skips any key
     * that already exists (including soft-deleted) so re-running is safe and a
     * tenant that intentionally removed a default is not resurrected.
     */
    public function seedDefaults(Tenant $tenant): void
    {
        foreach (self::DEFAULTS as $default) {
            $exists = ProductField::withTrashed()
                ->where('tenant_id', $tenant->id)
                ->where('key', $default['key'])
                ->exists();

            if ($exists) {
                continue;
            }

            ProductField::create([
                'tenant_id' => $tenant->id,
                'key' => $default['key'],
                'label' => $default['label'],
                'type' => $default['type'],
                'options' => null,
                'is_required' => false,
                'is_unique' => false,
                'display_order' => $default['display_order'],
            ]);
        }
    }
}
