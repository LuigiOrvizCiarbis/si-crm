<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductFieldRequest extends FormRequest
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
            'label' => ['sometimes', 'required', 'string', 'max:120'],
            'options' => ['sometimes', 'nullable', 'array'],
            'options.choices' => ['sometimes', 'nullable', 'array'],
            'options.choices.*' => ['string', 'max:120'],
            'is_required' => ['sometimes', 'boolean'],
            'is_unique' => ['sometimes', 'boolean'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function withValidator($validator): void
    {
        $field = $this->route('product_field');

        $validator->after(function ($v) use ($field) {
            if (! $field) {
                return;
            }

            if ($this->has('type') && $this->input('type') !== $field->type->value) {
                $v->errors()->add('type', 'No se puede cambiar el tipo de un campo existente.');
            }

            if ($this->has('key') && $this->input('key') !== $field->key) {
                $v->errors()->add('key', 'No se puede cambiar la clave de un campo existente.');
            }

            if ($field->type->requiresOptions() && $this->has('options')) {
                $choices = $this->input('options.choices');
                if (! is_array($choices) || count($choices) === 0) {
                    $v->errors()->add('options.choices', 'Debe proveer al menos una opción.');
                }
            }
        });
    }
}
