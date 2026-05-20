<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use App\Support\PermissionCatalog;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\JsonResponse;

class RoleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Role::class);

        $roles = Role::query()
            ->where('tenant_id', $request->user()->tenant_id)
            ->with(['permissions:id,name'])
            ->orderBy('id')
            ->get()
            ->map(fn (Role $role) => $this->transform($role));

        return response()->json(['data' => $roles]);
    }

    public function show(Request $request, Role $role): JsonResponse
    {
        $this->authorize('view', $role);

        $role->load('permissions:id,name');

        return response()->json(['data' => $this->transform($role)]);
    }

    public function store(StoreRoleRequest $request, PermissionRegistrar $registrar): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $registrar->setPermissionsTeamId($tenantId);

        $role = Role::create([
            'name' => $request->validated('name'),
            'guard_name' => 'web',
            'tenant_id' => $tenantId,
            'is_system' => false,
        ]);

        $permissions = $request->validated('permissions') ?? [];
        if ($permissions !== []) {
            $role->syncPermissions($permissions);
        }

        $registrar->forgetCachedPermissions();
        $role->load('permissions:id,name');

        return response()->json(['data' => $this->transform($role)], 201);
    }

    public function update(UpdateRoleRequest $request, Role $role, PermissionRegistrar $registrar): JsonResponse
    {
        $this->authorize('update', $role);

        $registrar->setPermissionsTeamId($request->user()->tenant_id);

        if ($request->has('name')) {
            $role->name = $request->validated('name');
            $role->save();
        }

        if ($request->has('permissions')) {
            $role->syncPermissions($request->validated('permissions'));
        }

        $registrar->forgetCachedPermissions();
        $role->load('permissions:id,name');

        return response()->json(['data' => $this->transform($role)]);
    }

    public function destroy(Request $request, Role $role): JsonResponse
    {
        $this->authorize('delete', $role);

        $usersWithRole = $role->users()->count();
        if ($usersWithRole > 0) {
            return response()->json([
                'message' => "No se puede eliminar el rol: {$usersWithRole} usuario(s) lo tienen asignado.",
            ], 422);
        }

        $role->delete();

        return response()->json(['message' => 'Rol eliminado']);
    }

    public function syncPermissions(Request $request, Role $role, PermissionRegistrar $registrar): JsonResponse
    {
        $this->authorize('syncPermissions', $role);

        $validated = $request->validate([
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string', Rule::in(PermissionCatalog::all())],
        ]);

        $registrar->setPermissionsTeamId($request->user()->tenant_id);
        $role->syncPermissions($validated['permissions']);
        $registrar->forgetCachedPermissions();

        $role->load('permissions:id,name');

        return response()->json(['data' => $this->transform($role)]);
    }

    /**
     * @return array<string, mixed>
     */
    private function transform(Role $role): array
    {
        return [
            'id' => $role->id,
            'name' => $role->name,
            'is_system' => (bool) $role->is_system,
            'permissions' => $role->permissions->pluck('name')->values(),
            'created_at' => $role->created_at,
            'updated_at' => $role->updated_at,
        ];
    }
}
