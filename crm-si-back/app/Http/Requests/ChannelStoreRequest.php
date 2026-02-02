<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChannelStoreRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'code' => 'required|string',
            'name' => 'sometimes|nullable|string|max:255',
            'data' => 'required|array',
            'data.phone_number_id' => 'required|string',
            'data.waba_id' => 'required|string',
            'data.business_id' => 'nullable|string',
            'waba_id' => 'sometimes|string',
            'phone_number_id' => 'sometimes|string',
            'business_id' => 'sometimes|string',
            'full_response' => 'nullable|array',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.required' => 'El código de autorización es requerido',
            'code.string' => 'El código debe ser una cadena de texto',
            'data.required' => 'Los datos de configuración son requeridos',
            'data.array' => 'Los datos deben ser un objeto',
            'data.phone_number_id.required' => 'El phone_number_id es requerido',
            'data.waba_id.required' => 'El waba_id es requerido',
            'name.string' => 'El nombre debe ser una cadena de texto',
            'name.max' => 'El nombre no puede exceder 255 caracteres',
        ];
    }
}
