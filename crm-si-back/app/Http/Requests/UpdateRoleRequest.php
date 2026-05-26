<?php

namespace App\Http\Requests;

use App\Models\Tenant;
use App\Support\PermissionCatalog;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('roles.manage') ?? false;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;
        $roleId = $this->route('role')?->id;

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('roles', 'name')
                    ->where(fn ($q) => $q->where('tenant_id', $tenantId))
                    ->ignore($roleId),
            ],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', Rule::in(PermissionCatalog::all())],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if (! $this->has('name')) {
                return;
            }

            $role = $this->route('role');
            if (! $role instanceof Role || $role->tenant_id === null) {
                return;
            }

            $ownerRoleId = Tenant::query()->whereKey($role->tenant_id)->value('owner_role_id');
            if ($ownerRoleId !== null && (int) $ownerRoleId === (int) $role->id) {
                $v->errors()->add('name', 'No se puede renombrar el rol Owner del tenant.');
            }
        });
    }
}
