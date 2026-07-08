<?php

namespace App\Http\Requests;

use App\Enums\ContactFieldType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('product_fields.manage') ?? false;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:120'],
            'type' => ['required', 'string', Rule::in(ContactFieldType::values())],
            'options' => ['nullable', 'array'],
            'options.choices' => ['nullable', 'array'],
            'options.choices.*' => ['string', 'max:120'],
            'is_required' => ['sometimes', 'boolean'],
            'is_unique' => ['sometimes', 'boolean'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            $type = ContactFieldType::tryFrom((string) $this->input('type'));
            if ($type?->requiresOptions()) {
                $choices = $this->input('options.choices');
                if (! is_array($choices) || count($choices) === 0) {
                    $v->errors()->add('options.choices', 'Debe proveer al menos una opción.');
                }
            }
        });
    }
}
