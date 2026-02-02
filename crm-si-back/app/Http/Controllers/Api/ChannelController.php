<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Enums\UserRole;
use Illuminate\Http\Request;
use App\Models\Channel;

class ChannelController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $roleValue = $user->role instanceof UserRole ? $user->role->value : $user->role;
        $isAdmin = $roleValue === null || $roleValue === UserRole::ADMIN->value;

        $query = Channel::query()
            ->with('whatsappConfig', 'user', 'users')
            ->orderBy('name');

        // Si no es admin, solo ver canales propios o asignados
        if (!$isAdmin) {
            $query->where(function ($q) use ($user) {
                // Canales donde es dueño
                $q->where('user_id', $user->id)
                  // O canales donde está asignado (many-to-many)
                  ->orWhereHas('users', function ($subQ) use ($user) {
                      $subQ->where('users.id', $user->id);
                  });
            });
        }

        $channels = $query->get();

        return response()->json(['data' => $channels]);
    }

    /**
     * Obtener usuarios asignados a un canal
     */
    public function users($id)
    {
        $channel = Channel::with('users:id,name,email,role')->findOrFail($id);

        return response()->json([
            'data' => $channel->users,
            'owner' => $channel->user
        ]);
    }

    /**
     * Agregar usuario a un canal
     */
    public function addUser(Request $request, $id)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $channel = Channel::findOrFail($id);

        // Agregar sin duplicar
        $channel->users()->syncWithoutDetaching([$request->user_id]);

        return response()->json([
            'message' => 'Usuario agregado al canal',
            'users' => $channel->users()->get(['id', 'name', 'email', 'role'])
        ]);
    }

    /**
     * Remover usuario de un canal
     */
    public function removeUser(Request $request, $id, $userId)
    {
        $channel = Channel::findOrFail($id);

        // No permitir remover al dueño principal
        if ($channel->user_id == $userId) {
            return response()->json([
                'message' => 'No se puede remover al dueño principal del canal'
            ], 422);
        }

        $channel->users()->detach($userId);

        return response()->json([
            'message' => 'Usuario removido del canal',
            'users' => $channel->users()->get(['id', 'name', 'email', 'role'])
        ]);
    }

    /**
     * Sincronizar usuarios de un canal (reemplazar todos)
     */
    public function syncUsers(Request $request, $id)
    {
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $channel = Channel::findOrFail($id);

        // Sincronizar usuarios (reemplaza los existentes)
        $channel->users()->sync($request->user_ids);

        return response()->json([
            'message' => 'Usuarios sincronizados',
            'users' => $channel->users()->get(['id', 'name', 'email', 'role'])
        ]);
    }
}

/* {
    "data": [
        {
            "id": "1",
            "name": "WhatsApp Business",

            "platform": "whatsapp",
            "status": "connected",
            "conversationsCount": 0
        }
    ]
} */

   /*  {
    "data": [
        {
            "id": 1,
            "tenant_id": 1,
            "user_id": 1,
            "type": 1,
            "name": "WhatsApp Business",
            "status": "active",
            "created_at": "2025-11-12T14:25:52.000000Z",
            "updated_at": "2025-11-12T14:25:52.000000Z",
            "whatsapp_config": {
                "id": 1,
                "channel_id": 1,
                "phone_number_id": "750862708121414",
                "waba_id": "1174503274607639",
                "verify_token": null,
                "created_at": "2025-11-12T14:25:52.000000Z",
                "updated_at": "2025-11-12T14:25:52.000000Z"
            },
            "user": {
                "id": 1,
                "tenant_id": 1,
                "name": "Admin User",
                "email": "admin@demo.com",
                "role": 1,
                "created_at": "2025-11-12T14:22:49.000000Z",
                "updated_at": "2025-11-12T14:22:49.000000Z"
            }
        }
    ]
} */
