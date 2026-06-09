<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreNoteRequest;
use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    private const EAGER_LOAD = [
        'author:id,name,email',
    ];

    public function index(Request $request): JsonResponse
    {
        $query = Note::query()
            ->visibleTo($request->user())
            ->with(self::EAGER_LOAD)
            ->latest('created_at')
            ->latest('id');

        if ($request->filled('contact_id')) {
            $query->where('contact_id', $request->integer('contact_id'));
        }

        if ($request->filled('conversation_id')) {
            $query->where('conversation_id', $request->integer('conversation_id'));
        }

        $notes = $query->paginate((int) $request->query('per_page', 100));

        return response()->json([
            'data' => $notes->items(),
            'meta' => [
                'total' => $notes->total(),
                'current_page' => $notes->currentPage(),
                'last_page' => $notes->lastPage(),
            ],
        ]);
    }

    public function store(StoreNoteRequest $request): JsonResponse
    {
        $note = Note::create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
        ]);

        $note->load(self::EAGER_LOAD);

        return response()->json(['data' => $note], 201);
    }

    public function destroy(Request $request, Note $note): JsonResponse
    {
        $user = $request->user();

        abort_unless(
            (int) $note->created_by === (int) $user->id || $user->isTenantOwner(),
            403,
        );

        $note->delete();

        return response()->json(['message' => 'Nota eliminada']);
    }
}
