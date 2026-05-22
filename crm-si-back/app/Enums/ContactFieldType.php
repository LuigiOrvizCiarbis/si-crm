<?php

namespace App\Enums;

use Illuminate\Validation\Rule;

enum ContactFieldType: string
{
    case Text = 'text';
    case Number = 'number';
    case Date = 'date';
    case Boolean = 'boolean';
    case Select = 'select';
    case MultiSelect = 'multi_select';
    case Email = 'email';
    case Url = 'url';
    case Phone = 'phone';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function requiresOptions(): bool
    {
        return in_array($this, [self::Select, self::MultiSelect], true);
    }

    /**
     * Validation rules for a single value of this type.
     *
     * @param  array<string, mixed>|null  $options
     * @return array<int, mixed>
     */
    public function valueRules(?array $options = null): array
    {
        $choices = is_array($options['choices'] ?? null) ? $options['choices'] : [];

        return match ($this) {
            self::Text => ['nullable', 'string', 'max:1000'],
            self::Number => ['nullable', 'numeric'],
            self::Date => ['nullable', 'date'],
            self::Boolean => ['nullable', 'boolean'],
            self::Select => ['nullable', 'string', Rule::in($choices)],
            self::MultiSelect => ['nullable', 'array'],
            self::Email => ['nullable', 'email', 'max:255'],
            self::Url => ['nullable', 'url', 'max:2048'],
            self::Phone => ['nullable', 'string', 'max:50'],
        };
    }

    /**
     * Rules applied to each item of an array-typed value (multi-select).
     *
     * @param  array<string, mixed>|null  $options
     * @return array<int, mixed>|null
     */
    public function itemRules(?array $options = null): ?array
    {
        if ($this !== self::MultiSelect) {
            return null;
        }

        $choices = is_array($options['choices'] ?? null) ? $options['choices'] : [];

        return ['string', Rule::in($choices)];
    }
}
