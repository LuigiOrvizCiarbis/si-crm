<?php

namespace App\Http\Requests;

use App\Services\MessageTranslationService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TranslateMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'target_language' => ['required', 'string', Rule::in(MessageTranslationService::SUPPORTED_LANGUAGES)],
        ];
    }
}
