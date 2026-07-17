<?php

namespace App\Http\Requests;

class UpdateAutomationRequest extends StoreAutomationRequest
{
    public function rules(): array
    {
        $rules = parent::rules();
        foreach ($rules as $key => &$value) {
            if (! str_starts_with($key, 'actions.*.')) {
                $value[0] = 'sometimes';
            }
        }
        unset($value);

        return $rules;
    }
}
