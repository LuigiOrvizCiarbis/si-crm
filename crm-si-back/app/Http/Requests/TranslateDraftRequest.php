<?php

namespace App\Http\Requests;

use App\Services\MessageTranslationService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TranslateDraftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content' => ['required', 'string', 'max:10000'],
            'target_language' => ['required', 'string', Rule::in(MessageTranslationService::SUPPORTED_LANGUAGES)],
        ];
    }
}
