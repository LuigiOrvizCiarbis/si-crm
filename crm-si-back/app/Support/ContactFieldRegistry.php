<?php

namespace App\Support;

use App\Enums\ContactFieldType;

class ContactFieldRegistry
{
    /**
     * Slugs that cannot be used as custom field keys (reserved for system columns
     * and well-known fields).
     *
     * @return list<string>
     */
    public static function reservedKeys(): array
    {
        return [
            'id',
            'tenant_id',
            'name',
            'phone',
            'email',
            'external_id',
            'source',
            'custom_data',
            'created_at',
            'updated_at',
            'deleted_at',
        ];
    }

    /**
     * System-managed standard fields. These live as real columns on the contacts
     * table; we expose them here so the frontend can render them uniformly with
     * tenant-defined custom fields.
     *
     * @return list<array<string, mixed>>
     */
    public static function standard(): array
    {
        return [
            [
                'key' => 'name',
                'label' => 'Nombre',
                'type' => ContactFieldType::Text->value,
                'options' => null,
                'is_required' => true,
                'is_unique' => false,
                'is_system' => true,
                'display_order' => 0,
            ],
            [
                'key' => 'phone',
                'label' => 'Teléfono',
                'type' => ContactFieldType::Phone->value,
                'options' => null,
                'is_required' => false,
                'is_unique' => false,
                'is_system' => true,
                'display_order' => 1,
            ],
            [
                'key' => 'email',
                'label' => 'Email',
                'type' => ContactFieldType::Email->value,
                'options' => null,
                'is_required' => false,
                'is_unique' => false,
                'is_system' => true,
                'display_order' => 2,
            ],
            [
                'key' => 'source',
                'label' => 'Origen',
                'type' => ContactFieldType::Select->value,
                'options' => ['choices' => ['whatsapp', 'instagram', 'facebook', 'manual']],
                'is_required' => false,
                'is_unique' => false,
                'is_system' => true,
                'display_order' => 3,
            ],
        ];
    }
}
