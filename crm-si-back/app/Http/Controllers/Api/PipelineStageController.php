<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PipelineStage;
use Illuminate\Http\Request;

class PipelineStageController extends Controller
{
    public function index(Request $request)
    {
        return PipelineStage::orderBy('sort_order', 'asc')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        // Calcular el orden para ponerlo al final
        $maxOrder = PipelineStage::max('sort_order') ?? 0;

        $stage = PipelineStage::create([
            'name' => $validated['name'],
            'sort_order' => $maxOrder + 1,
        ]);

        return response()->json($stage, 201);
    }

    public function update(Request $request, $id)
    {
        $stage = PipelineStage::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'sort_order' => 'sometimes|integer',
        ]);

        $stage->update($validated);

        return response()->json($stage);
    }

    public function destroy($id)
    {
        $stage = PipelineStage::findOrFail($id);

        // Opcional: Mover conversaciones a una etapa por defecto antes de borrar
        // o dejar que se pongan en null (según la migración)

        $stage->delete();
        return response()->noContent();
    }

    // Método para reordenar todas las etapas (Drag & Drop de columnas)
    public function reorder(Request $request)
    {
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
