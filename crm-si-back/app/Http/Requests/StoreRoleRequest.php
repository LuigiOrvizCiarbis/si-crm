<?php

namespace App\Http\Requests;

use App\Support\PermissionCatalog;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StoreRoleRequest extends FormRequest
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

        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('roles', 'name')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::in(PermissionCatalog::all())],
        ];
    }

    /**
     * Reject names that collide (case- and accent-insensitive) with any
     * existing system role in the same tenant. Prevents recreating duplicates
     * like a non-system "Admin" alongside the seeded one.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $name = $this->input('name');
            if (! is_string($name) || $name === '') {
                return;
            }

            $tenantId = $this->user()->tenant_id;
            $normalized = $this->normalize($name);

            $reservedNames = DB::table('roles')
                ->where('tenant_id', $tenantId)
                ->where('is_system', true)
                ->pluck('name')
                ->all();

            foreach ($reservedNames as $reserved) {
                if ($this->normalize((string) $reserved) === $normalized) {
                    $v->errors()->add('name', "El nombre \"{$name}\" está reservado por un rol del sistema.");

                    return;
                }
            }
        });
    }

    private function normalize(string $value): string
    {
        $trimmed = trim($value);
        $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $trimmed);

        return mb_strtolower($ascii !== false ? $ascii : $trimmed);
    }
}
