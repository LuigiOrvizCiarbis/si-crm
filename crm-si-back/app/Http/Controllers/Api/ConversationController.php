<?php

namespace App\Http\Controllers\Api;

use App\Enums\MessageDirection;
use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\Conversation;
use App\Models\Opportunity;
use App\Models\PipelineStage;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

class ConversationController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Conversation::class);

        $contactId = $request->query('contact_id');
        $channelId = $request->query('channel_id');
        $filterByUserId = $request->query('user_id');

        $user = $request->user();
        $canViewAny = $user->can('conversations.view_any');

        $q = Conversation::query()
            ->with(['contact:id,name,phone', 'channel:id,name,type', 'messages:id', 'tags'])
            ->visibleTo($user);

        if ($canViewAny && $filterByUserId) {
            $q->where(function ($query) use ($filterByUserId) {
                $query->whereHas('users', function ($q) use ($filterByUserId) {
                    $q->where('users.id', $filterByUserId);
                })
                    ->orWhereHas('channel', function ($q) use ($filterByUserId) {
                        $q->where('user_id', $filterByUserId);
                    });
            });
        }

        if ($contactId) {
            $q->where('contact_id', $contactId);
        }
        if ($channelId) {
            $channel = Channel::with('users:id')->findOrFail($channelId);
            $channelUserIds = $channel->users
                ->pluck('id')
                ->push($channel->user_id)
                ->filter()
                ->unique()
                ->values()
                ->all();

            $q->where(function ($query) use ($channelId, $channelUserIds) {
                $query->where('channel_id', $channelId);

                if ($channelUserIds !== []) {
                    $query->orWhereIn('assigned_to', $channelUserIds)
                        ->orWhereHas('users', function ($userQuery) use ($channelUserIds) {
                            $userQuery->whereIn('users.id', $channelUserIds);
                        });
                }
            });
        }

        if ($request->filled('tags')) {
            $q->withTagSlugs($this->parseTagSlugs((string) $request->query('tags')));
        }

        if ($request->query('summary') === 'unread_count') {
            $unreadCount = (clone $q)
                ->reorder()
                ->join('messages', 'messages.conversation_id', '=', 'conversations.id')
                ->where('messages.direction', MessageDirection::INBOUND->value)
                ->whereNull('messages.read_at')
                ->whereNull('messages.deleted_at')
                ->count('messages.id');

            return response()->json([
                'data' => [
                    'unread_count' => $unreadCount,
                ],
            ]);
        }

        $q->orderByDesc('last_message_at');

        $conversations = $q->paginate((int) $request->query('per_page', 20));

        $data = $conversations->items();

        $transformed = array_map(function ($conversation) {
            return [
                'id' => $conversation->id,
                'channel_id' => $conversation->channel_id,
                'contact_id' => $conversation->contact_id,
                'contact' => $conversation->contact,
                'channel' => $conversation->channel,
                'last_message_at' => $conversation->last_message_at,
                'last_message' => $conversation->last_message_content ?? 'Sin mensajes',
                'unread_count' => $conversation->unread_count ?? 0,
                'lead_score' => $conversation->lead_score,
                'pipeline_stage_id' => $conversation->pipeline_stage_id,
                'assigned_to' => $conversation->assigned_to,
                'created_at' => $conversation->created_at,
                'updated_at' => $conversation->updated_at,
                'messages' => $conversation->messages,
                'tags' => $conversation->tags,
            ];
        }, $data);

        return response()->json([
            'data' => $transformed,
            'meta' => [
                'total' => $conversations->total(),
                'current_page' => $conversations->currentPage(),
                'last_page' => $conversations->lastPage(),
            ],
        ]);
    }

    public function show($id): JsonResponse
    {

        $conversation = Conversation::with([
            'messages' => function ($q) {
                // CAMBIO SUGERIDO: Aumentar de 4 a 20 para llenar la pantalla inicial
                $q->orderBy('created_at', 'desc')->limit(20);
            },
            'contact:id,name,phone',
            'channel:id,name,type',
            'tags',
        ])
            ->findOrFail($id);

        $this->authorize('view', $conversation);

        $conversation->setRelation('messages', $conversation->messages->sortBy('created_at')->values());

        // Agregar assigned_to explícitamente
        $data = $conversation->toArray();
        $data['assigned_to'] = $conversation->assigned_to;

        return response()->json(['data' => $data]);
    }

    // NUEVO MÉTODO: Obtener mensajes paginados (Infinite Scroll)
    public function fetchMessages(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);
        $this->authorize('view', $conversation);

        $perPage = (int) $request->query('per_page', 20);

        // Obtenemos mensajes ordenados por fecha descendente (del más nuevo al más viejo)
        // Laravel Paginator se encarga de 'page=1', 'page=2', etc.
        $messages = $conversation->messages()
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json($messages);
    }

    public function updateStage(Request $request, $id)
    {
        $conversation = Conversation::where('id', $id)->firstOrFail();
        $this->authorize('changeStage', $conversation);

        $request->validate([
            'pipeline_stage_id' => 'required|exists:pipeline_stages,id',
        ]);

        // Validar que la etapa destino pertenezca al mismo tenant (seguridad extra)
        $stage = PipelineStage::where('id', $request->pipeline_stage_id)->firstOrFail();

        $conversation->update([
            'pipeline_stage_id' => $stage->id,
        ]);

        // Sincronizar la Opportunity vinculada: actualizar si existe, crear si no
        $opportunity = Opportunity::where('conversation_id', $conversation->id)->first();

        if ($opportunity) {
            $opportunity->update([
                'pipeline_stage_id' => $stage->id,
                'last_activity_at' => now(),
            ]);
        } else {
            Opportunity::create([
                'conversation_id' => $conversation->id,
                'contact_id' => $conversation->contact_id,
                'pipeline_stage_id' => $stage->id,
                'title' => 'Oportunidad - '.($conversation->contact?->name ?? 'Sin nombre'),
                'status' => 'open',
                'source_type' => 'conversation',
                'last_activity_at' => now(),
            ]);
        }

        return response()->json($conversation);
    }

    /**
     * Asignar/derivar usuarios a una conversación
     */
    public function assignUsers(Request $request, $id)
    {
        $conversation = Conversation::where('id', $id)->firstOrFail();
        $this->authorize('assign', $conversation);

        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);
        $currentUserId = auth()->id();

        // Sincronizar usuarios con pivot data
        $syncData = [];
        foreach ($request->user_ids as $userId) {
            $syncData[$userId] = ['assigned_by' => $currentUserId];
        }

        $conversation->users()->sync($syncData);

        return response()->json([
            'message' => 'Usuarios asignados correctamente',
            'users' => $conversation->users,
        ]);
    }

    /**
     * Agregar un usuario adicional a la conversación
     */
    public function addUser(Request $request, $id)
    {
        $conversation = Conversation::where('id', $id)->firstOrFail();
        $this->authorize('assign', $conversation);

        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);
        $currentUserId = auth()->id();

        // Actualizar el responsable principal
        $conversation->update(['assigned_to' => $request->user_id]);

        // Attach sin eliminar existentes (para historial many-to-many)
        $conversation->users()->syncWithoutDetaching([
            $request->user_id => ['assigned_by' => $currentUserId],
        ]);

        return response()->json([
            'message' => 'Usuario asignado correctamente',
            'assigned_to' => $conversation->assigned_to,
            'users' => $conversation->users,
        ]);
    }

    /**
     * Remover un usuario de la conversación
     */
    public function removeUser(Request $request, $id, $userId)
    {
        $conversation = Conversation::where('id', $id)->firstOrFail();
        $this->authorize('assign', $conversation);

        $conversation->users()->detach($userId);

        return response()->json([
            'message' => 'Usuario removido correctamente',
            'users' => $conversation->users,
        ]);
    }

    private function parseTagSlugs(string $tags): array
    {
        return array_values(array_filter(array_map('trim', explode(',', $tags))));
    }
}
