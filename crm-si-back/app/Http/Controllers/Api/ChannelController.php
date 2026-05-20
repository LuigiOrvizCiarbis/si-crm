<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Channel;
use Illuminate\Http\Request;

class ChannelController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Channel::class);

        $user = $request->user();

        $channels = Channel::query()
            ->with('whatsappConfig', 'user', 'users')
            ->visibleTo($user)
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $channels]);
    }

    public function users(Request $request, $id)
    {
        $channel = Channel::findOrFail($id);
        $this->authorize('view', $channel);

        $channel->load('users:id,name,email');

        return response()->json([
            'data' => $channel->users,
            'owner' => $channel->user,
        ]);
    }

    public function addUser(Request $request, $id)
    {
        $channel = Channel::findOrFail($id);
        $this->authorize('manageUsers', $channel);

        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $channel->users()->syncWithoutDetaching([$request->user_id]);

        return response()->json([
            'message' => 'Usuario agregado al canal',
            'users' => $channel->users()->get(['id', 'name', 'email']),
        ]);
    }

    public function removeUser(Request $request, $id, $userId)
    {
        $channel = Channel::findOrFail($id);
        $this->authorize('manageUsers', $channel);

        if ($channel->user_id == $userId) {
            return response()->json([
                'message' => 'No se puede remover al dueño principal del canal',
            ], 422);
        }

        $channel->users()->detach($userId);

        return response()->json([
            'message' => 'Usuario removido del canal',
            'users' => $channel->users()->get(['id', 'name', 'email']),
        ]);
    }

    public function syncUsers(Request $request, $id)
    {
        $channel = Channel::findOrFail($id);
        $this->authorize('manageUsers', $channel);

        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $channel->users()->sync($request->user_ids);

        return response()->json([
            'message' => 'Usuarios sincronizados',
            'users' => $channel->users()->get(['id', 'name', 'email']),
        ]);
    }
}
