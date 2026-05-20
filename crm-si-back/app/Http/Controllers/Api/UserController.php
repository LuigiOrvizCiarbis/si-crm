<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssignRoleRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\JsonResponse;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $tenantId = $request->user()->tenant_id;

        $users = User::query()
            ->where('tenant_id', $tenantId)
            ->with(['roles' => fn ($q) => $q->where('roles.tenant_id', $tenantId)])
            ->orderBy('name')
            ->get()
            ->map(fn (User $u) => $this->transform($u, $tenantId));

        return response()->json(['data' => $users]);
    }

    public function show(Request $request, User $user): JsonResponse
    {
        $this->authorize('view', $user);

        $tenantId = $request->user()->tenant_id;
        $user->load(['roles' => fn ($q) => $q->where('roles.tenant_id', $tenantId)]);

        return response()->json(['data' => $this->transform($user, $tenantId)]);
    }

    public function assignRole(AssignRoleRequest $request, User $user, PermissionRegistrar $registrar): JsonResponse
    {
        $this->authorize('assignRole', $user);

        $actor = $request->user();
        $tenantId = $actor->tenant_id;

        if ((int) $user->tenant_id !== (int) $tenantId) {
            abort(403, 'Usuario fuera del tenant');
        }

        $registrar->setPermissionsTeamId($tenantId);

        $newRoleName = $request->validated('role_name');

        // Only an Owner may grant or revoke the Owner role.
        $actorIsOwner = $actor->hasRole('Owner');
        $targetIsOwner = $user->hasRole('Owner');

        if ($newRoleName === 'Owner' && ! $actorIsOwner) {
            abort(403, 'Solo un Owner puede asignar el rol Owner.');
        }

        if ($targetIsOwner && $newRoleName !== 'Owner' && ! $actorIsOwner) {
            abort(403, 'Solo un Owner puede degradar a otro Owner.');
        }

        // Prevent leaving the tenant without any Owner.
        if ($targetIsOwner && $newRoleName !== 'Owner') {
            $remainingOwners = User::query()
                ->where('tenant_id', $tenantId)
                ->where('id', '!=', $user->id)
                ->whereHas('roles', fn ($q) => $q->where('roles.tenant_id', $tenantId)->where('name', 'Owner'))
                ->count();

            if ($remainingOwners === 0) {
                abort(422, 'No puedes dejar al tenant sin Owner. Asigna otro Owner antes de cambiar este rol.');
            }
        }

        $user->syncRoles([$newRoleName]);
        $registrar->forgetCachedPermissions();

        $user->load(['roles' => fn ($q) => $q->where('roles.tenant_id', $tenantId)]);

        return response()->json(['data' => $this->transform($user, $tenantId)]);
    }

    /**
     * @return array<string, mixed>
     */
    private function transform(User $user, int $tenantId): array
    {
        $role = $user->roles->first();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'tenant_id' => $user->tenant_id,
            'role' => $role ? [
                'id' => $role->id,
                'name' => $role->name,
                'is_system' => (bool) $role->is_system,
            ] : null,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
    }
}
