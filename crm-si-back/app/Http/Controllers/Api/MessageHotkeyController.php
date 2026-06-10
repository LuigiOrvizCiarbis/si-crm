<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MessageHotkey;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\JsonResponse;

class MessageHotkeyController extends Controller
{
    private const TRIGGER_REGEX = '/^[a-z0-9_-]+$/';

    /**
     * Mirrors the frontend's isAdminRole() check (lib/permissions.ts): roles can
     * be renamed per tenant, so we detect managers by permissions, not by name.
     */
    private const TENANT_MANAGER_PERMISSIONS = ['users.view', 'invitations.create'];

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $hotkeys = MessageHotkey::query()
            ->where(function ($query) use ($user) {
                $query->whereNull('user_id')
                    ->orWhere('user_id', $user->id);
            })
            ->orderBy('trigger')
            ->get()
            ->map(fn (MessageHotkey $hotkey) => $this->transform($hotkey));

        return response()->json(['data' => $hotkeys]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $scope = $request->input('scope', 'personal');

        $this->ensureScopeAllowed($user, $scope);

        $validated = $this->validateInput($request, $user, $scope);

        $hotkey = MessageHotkey::create([
            'user_id' => $scope === 'tenant' ? null : $user->id,
            'trigger' => $validated['trigger'],
            'content' => $validated['content'],
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json(['data' => $this->transform($hotkey)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $hotkey = MessageHotkey::findOrFail($id);
        $scope = $this->scopeOf($hotkey);

        $this->ensureManageAllowed($user, $hotkey);

        $validated = $this->validateInput($request, $user, $scope, $hotkey->id);

        $hotkey->update([
            'trigger' => $validated['trigger'],
            'content' => $validated['content'],
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json(['data' => $this->transform($hotkey)]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $hotkey = MessageHotkey::findOrFail($id);

        $this->ensureManageAllowed($request->user(), $hotkey);

        $hotkey->delete();

        return response()->json(['message' => 'Hotkey eliminado']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateInput(Request $request, $user, string $scope, ?int $ignoreId = null): array
    {
        $request->merge([
            'trigger' => is_string($request->input('trigger'))
                ? strtolower(trim(ltrim($request->input('trigger'), '/')))
                : $request->input('trigger'),
        ]);

        $uniqueRule = Rule::unique('message_hotkeys')
            ->where('tenant_id', $user->tenant_id)
            ->where('user_id', $scope === 'tenant' ? null : $user->id);

        if ($ignoreId !== null) {
            $uniqueRule = $uniqueRule->ignore($ignoreId);
        }

        return $request->validate([
            'trigger' => [
                'required',
                'string',
                'max:64',
                'regex:'.self::TRIGGER_REGEX,
                $uniqueRule,
            ],
            'content' => ['required', 'string', 'max:4000'],
            'description' => ['nullable', 'string', 'max:255'],
        ], [
            'trigger.regex' => 'El trigger solo puede contener letras minúsculas, números, guiones y guiones bajos.',
            'trigger.unique' => 'Ya existe un hotkey con ese trigger en este alcance.',
        ]);
    }

    private function ensureScopeAllowed($user, string $scope): void
    {
        if (! in_array($scope, ['tenant', 'personal'], true)) {
            throw ValidationException::withMessages([
                'scope' => 'Alcance inválido.',
            ]);
        }

        if ($scope === 'tenant' && ! $this->canManageTenantHotkeys($user)) {
            abort(403, 'No tienes permisos para gestionar hotkeys del equipo.');
        }
    }

    private function ensureManageAllowed($user, MessageHotkey $hotkey): void
    {
        if ($hotkey->user_id === null) {
            if (! $this->canManageTenantHotkeys($user)) {
                abort(403, 'No tienes permisos para gestionar hotkeys del equipo.');
            }

            return;
        }

        if ($hotkey->user_id !== $user->id) {
            abort(403, 'No puedes modificar hotkeys de otro usuario.');
        }
    }

    private function canManageTenantHotkeys($user): bool
    {
        return $user->isTenantOwner()
            || $user->hasAllPermissions(self::TENANT_MANAGER_PERMISSIONS);
    }

    private function scopeOf(MessageHotkey $hotkey): string
    {
        return $hotkey->user_id === null ? 'tenant' : 'personal';
    }

    /**
     * @return array<string, mixed>
     */
    private function transform(MessageHotkey $hotkey): array
    {
        return [
            'id' => $hotkey->id,
            'trigger' => $hotkey->trigger,
            'content' => $hotkey->content,
            'description' => $hotkey->description,
            'scope' => $this->scopeOf($hotkey),
            'user_id' => $hotkey->user_id,
            'created_at' => $hotkey->created_at,
            'updated_at' => $hotkey->updated_at,
        ];
    }
}
