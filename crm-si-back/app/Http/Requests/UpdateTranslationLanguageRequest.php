<?php

namespace App\Http\Requests;

use App\Services\MessageTranslationService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTranslationLanguageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contact_language' => ['required', 'string', Rule::in(MessageTranslationService::SUPPORTED_LANGUAGES)],
        ];
    }
}
