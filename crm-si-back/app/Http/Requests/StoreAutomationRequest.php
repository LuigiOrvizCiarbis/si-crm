<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAutomationRequest extends FormRequest
{
    // `timezone:all` valida contra DateTimeZone::ALL, que excluye los alias
    // legacy de la IANA. Los navegadores todavía reportan algunos vía
    // Intl.supportedValuesOf(), así que se canonizan antes de validar.
    private const TIMEZONE_ALIASES = [
        'America/Buenos_Aires' => 'America/Argentina/Buenos_Aires',
    ];

    public function authorize(): bool
    {
        return (bool) $this->user()?->can('automations.manage');
    }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('timezone')) {
            return;
        }

        $timezone = $this->string('timezone')->toString();

        $this->merge([
            'timezone' => self::TIMEZONE_ALIASES[$timezone] ?? $timezone,
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'trigger_type' => ['required', 'string', 'max:80'],
            'trigger_config' => ['present', 'array'],
            'conditions' => ['nullable', 'array'],
            'timezone' => ['nullable', 'timezone:all'],
            'actions' => ['required', 'array', 'min:1'],
            'actions.*.type' => ['required', 'string', 'max:80'],
            'actions.*.config' => ['present', 'array'],
        ];
    }
}
