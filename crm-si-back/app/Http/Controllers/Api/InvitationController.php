<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invitation;
use App\Models\Scopes\TenantScope;
use App\Models\User;
use App\Notifications\InvitationNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\JsonResponse;

class InvitationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Invitation::class);

        $invitations = Invitation::with('invitedBy:id,name,email')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $invitations]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Invitation::class);

        $actor = $request->user();
        $tenantId = $actor->tenant_id;

        $validated = $request->validate([
            'email' => ['required', 'email'],
            'role_name' => [
                'required',
                'string',
                'max:100',
                Rule::exists('roles', 'name')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
        ]);

        // Only an Owner may issue invitations for the Owner role. Otherwise an
        // Admin holding invitations.create could elevate someone to Owner once
        // they accept the invite.
        if ($validated['role_name'] === 'Owner' && ! $actor->hasRole('Owner')) {
            abort(403, 'Solo un Owner puede invitar con el rol Owner.');
        }

        // Check if already a member of this tenant
        $existingUserTenantId = User::where('email', $validated['email'])->value('tenant_id');
        if ($existingUserTenantId !== null && (int) $existingUserTenantId === (int) $tenantId) {
            return response()->json(['message' => 'Este email ya es miembro del equipo.'], 422);
        }

        // Check for pending invitation
        $existingInvitation = Invitation::pending()
            ->where('email', $validated['email'])
            ->first();

        if ($existingInvitation) {
            return response()->json(['message' => 'Ya existe una invitación pendiente para este email.'], 422);
        }

        $invitation = Invitation::create([
            'tenant_id' => $tenantId,
            'email' => $validated['email'],
            'token' => Str::random(64),
            'role_name' => $validated['role_name'],
            'invited_by' => $request->user()->id,
            'expires_at' => now()->addDays(7),
        ]);

        $invitation->load(['invitedBy:id,name,email', 'tenant:id,name']);

        Notification::route('mail', $validated['email'])
            ->notify(new InvitationNotification($invitation));

        return response()->json(['data' => $invitation], 201);
    }

    public function destroy(Request $request, Invitation $invitation): JsonResponse
    {
        $this->authorize('delete', $invitation);

        $invitation->delete();

        return response()->json(['message' => 'Invitación revocada.']);
    }

    /**
     * Public endpoint: view invitation details by token.
     */
    public function showByToken(string $token): JsonResponse
    {
        $invitation = Invitation::withoutGlobalScope(TenantScope::class)
            ->with('tenant:id,name', 'invitedBy:id,name')
            ->where('token', $token)
            ->first();

        if (! $invitation) {
            return response()->json(['message' => 'Invitación no encontrada.'], 404);
        }

        if ($invitation->isAccepted()) {
            return response()->json(['message' => 'Esta invitación ya fue aceptada.'], 410);
        }

        if ($invitation->isExpired()) {
            return response()->json(['message' => 'Esta invitación ha expirado.'], 410);
        }

        return response()->json([
            'data' => [
                'email' => $invitation->email,
                'role_name' => $invitation->role_name,
                'tenant_name' => $invitation->tenant->name ?? null,
                'inviter_name' => $invitation->invitedBy->name ?? null,
                'expires_at' => $invitation->expires_at,
            ],
        ]);
    }

    /**
     * Authenticated user accepts an invitation to join another tenant.
     */
    public function accept(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'size:64'],
        ]);

        $invitation = Invitation::withoutGlobalScope(TenantScope::class)
            ->where('token', $validated['token'])
            ->first();

        if (! $invitation) {
            return response()->json(['message' => 'Invitación no encontrada.'], 404);
        }

        if ($invitation->isAccepted()) {
            return response()->json(['message' => 'Esta invitación ya fue aceptada.'], 410);
        }

        if ($invitation->isExpired()) {
            return response()->json(['message' => 'Esta invitación ha expirado.'], 410);
        }

        $user = $request->user();

        if ($user->email !== $invitation->email) {
            return response()->json([
                'message' => 'Esta invitación fue enviada a otro email.',
            ], 403);
        }

        $newTenantId = $invitation->tenant_id;
        $roleName = $invitation->role_name ?? 'Admin';

        $registrar = app(PermissionRegistrar::class);
        $roleExists = Role::query()
            ->where('tenant_id', $newTenantId)
            ->where('name', $roleName)
            ->exists();

        if (! $roleExists) {
            return response()->json(['message' => 'El rol asignado a la invitación ya no existe.'], 422);
        }

        // Switch user to new tenant
        $user->tenant_id = $newTenantId;
        $user->save();

        $registrar->setPermissionsTeamId($newTenantId);
        $user->syncRoles([$roleName]);

        // Mark invitation as accepted
        $invitation->update(['accepted_at' => now()]);

        // Revoke all tokens and create a new one
        $user->tokens()->delete();
        $token = $user->createToken('api-token')->plainTextToken;

        $role = $user->roles()->where('roles.tenant_id', $newTenantId)->first();

        return response()->json([
            'token' => $token,
            'user' => $user,
            'role' => $role ? ['id' => $role->id, 'name' => $role->name, 'is_system' => (bool) $role->is_system] : null,
            'permissions' => $user->getAllPermissions()->pluck('name')->values(),
            'message' => 'Te uniste al equipo exitosamente.',
        ]);
    }
}
