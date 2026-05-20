<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ImportContactsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'file' => 'required|file|mimes:csv,txt|max:5120',
            'mapping' => 'required|string',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function decodedMapping(): array
    {
        return json_decode($this->input('mapping'), true) ?? [];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $mapping = $this->decodedMapping();

            if (! is_array($mapping) || ! array_key_exists('name', $mapping)) {
                $validator->errors()->add('mapping', 'El mapeo debe incluir la columna "name".');
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'El archivo es requerido.',
            'file.file' => 'Debe ser un archivo válido.',
            'file.mimes' => 'El archivo debe ser CSV (.csv o .txt).',
            'file.max' => 'El archivo no puede superar los 5 MB.',
            'mapping.required' => 'El mapeo de columnas es requerido.',
            'mapping.string' => 'El mapeo debe ser una cadena JSON.',
        ];
    }
}
