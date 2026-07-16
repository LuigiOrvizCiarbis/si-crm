<?php

namespace App\Http\Requests;

use App\Enums\TemplateCategory;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateWhatsAppTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('templates.create');
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:512', 'regex:/^[a-z0-9_]+$/'],
            'language' => ['required', 'string', 'max:20', 'regex:/^[a-z]{2,3}(?:_[A-Z]{2})?$/'],
            'category' => ['required', 'string', Rule::in([TemplateCategory::Marketing->value, TemplateCategory::Utility->value])],
            'parameter_format' => ['nullable', Rule::in(['named'])],
            'components' => ['required', 'array', 'min:1'],
            'components.*.type' => ['required', 'string', Rule::in(['HEADER', 'BODY', 'FOOTER', 'BUTTONS'])],
            'components.*.format' => ['nullable', 'string', Rule::in(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'])],
            'components.*.text' => ['nullable', 'string', 'max:1024'],
            'components.*.example' => ['nullable', 'array'],
            'components.*.example.header_handle' => ['nullable', 'array', 'max:1'],
            'components.*.example.body_text_named_params' => ['nullable', 'array'],
            'components.*.example.body_text_named_params.*.param_name' => ['required_with:components.*.example.body_text_named_params', 'string', 'regex:/^[a-zA-Z][a-zA-Z0-9_]*$/'],
            'components.*.example.body_text_named_params.*.example' => ['required_with:components.*.example.body_text_named_params', 'string', 'max:1024'],
            'components.*.buttons' => ['nullable', 'array', 'max:3'],
            'components.*.buttons.*.type' => ['required', 'string', Rule::in(['QUICK_REPLY', 'URL', 'PHONE_NUMBER'])],
            'components.*.buttons.*.text' => ['required', 'string', 'max:25'],
            'components.*.buttons.*.url' => ['nullable', 'url', 'max:2000'],
            'components.*.buttons.*.phone_number' => ['nullable', 'string', 'max:20'],
        ];
    }

    protected function passedValidation(): void
    {
        $components = collect($this->validated('components', []));
        $body = $components->firstWhere('type', 'BODY');
        abort_if($body === null || blank($body['text'] ?? null), 422, 'El cuerpo de la plantilla es obligatorio.');

        $bodyText = (string) $body['text'];
        preg_match_all('/\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/', $bodyText, $matches);
        $names = array_values(array_unique($matches[1] ?? []));
        if ($names === []) {
            return;
        }

        $examples = collect($body['example']['body_text_named_params'] ?? [])->keyBy('param_name');
        foreach ($names as $name) {
            if (blank($examples->get($name)['example'] ?? null)) {
                abort(422, "Falta el ejemplo para la variable {{$name}}.");
            }
        }
    }
}
