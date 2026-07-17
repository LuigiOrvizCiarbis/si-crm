<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAutomationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('automations.manage');
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
