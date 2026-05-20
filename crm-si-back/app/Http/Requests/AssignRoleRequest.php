<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssignRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('users.assign_role') ?? false;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        return [
            'role_name' => [
                'required',
                'string',
                'max:100',
                Rule::exists('roles', 'name')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
        ];
    }
}
