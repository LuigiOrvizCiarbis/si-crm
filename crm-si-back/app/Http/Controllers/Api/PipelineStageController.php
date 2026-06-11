<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PipelineStage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Collection;

class PipelineStageController extends Controller
{
    public function index(Request $request): Collection
    {
        $this->authorize('viewAny', PipelineStage::class);

        return PipelineStage::orderBy('sort_order', 'asc')->get();
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', PipelineStage::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => ['sometimes', 'string', 'regex:/^#([0-9A-Fa-f]{6})$/'],
        ]);

        $maxOrder = PipelineStage::max('sort_order') ?? 0;

        $stage = PipelineStage::create([
            'name' => $validated['name'],
            'color' => $validated['color'] ?? '#3B82F6',
            'sort_order' => $maxOrder + 1,
        ]);

        return response()->json($stage, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $stage = PipelineStage::findOrFail($id);

        $this->authorize('update', $stage);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'color' => ['sometimes', 'string', 'regex:/^#([0-9A-Fa-f]{6})$/'],
            'sort_order' => 'sometimes|integer',
        ]);

        $stage->update($validated);

        return response()->json($stage);
    }

    public function destroy(string $id): Response
    {
        $stage = PipelineStage::findOrFail($id);

        $this->authorize('delete', $stage);

        $stage->delete();

        return response()->noContent();
    }

    public function reorder(Request $request): JsonResponse
    {
        $this->authorize('reorder', PipelineStage::class);

        $request->validate([
            'stages' => 'required|array',
            'stages.*.id' => 'required|exists:pipeline_stages,id',
            'stages.*.sort_order' => 'required|integer',
        ]);

        foreach ($request->stages as $item) {
            PipelineStage::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json(['message' => 'Orden actualizado']);
    }
}
