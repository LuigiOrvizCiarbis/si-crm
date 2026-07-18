<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MediaAsset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MediaAssetController extends Controller
{
    // Tope de Meta para documentos de template (100 MB). Se deja margen abajo
    // porque el archivo igual viaja por HTTP hasta el CRM antes de guardarse.
    private const MAX_KILOBYTES = 100 * 1024;

    public function index(Request $request): JsonResponse
    {
        $this->authorizeManage($request);

        $assets = MediaAsset::query()
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (MediaAsset $asset): array => $this->serialize($asset))
            ->all();

        return response()->json(['data' => $assets]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeManage($request);

        $validated = $request->validate([
            'file' => ['required', 'file', 'mimetypes:application/pdf', 'max:'.self::MAX_KILOBYTES],
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        $file = $request->file('file');
        $path = $file->store('media-assets/'.$request->user()->tenant_id, 'public');

        $asset = MediaAsset::create([
            'tenant_id' => $request->user()->tenant_id,
            'uploaded_by' => $request->user()->id,
            'name' => $validated['name'] ?? $file->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $file->getMimeType() ?: 'application/pdf',
            'size' => $file->getSize(),
        ]);

        return response()->json(['data' => $this->serialize($asset)], 201);
    }

    public function destroy(Request $request, MediaAsset $mediaAsset): JsonResponse
    {
        $this->authorizeManage($request);

        Storage::disk('public')->delete($mediaAsset->path);
        $mediaAsset->delete();

        return response()->json([], 204);
    }

    private function authorizeManage(Request $request): void
    {
        abort_unless((bool) $request->user()?->can('automations.manage'), 403);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(MediaAsset $asset): array
    {
        return [
            'id' => $asset->id,
            'name' => $asset->name,
            'mime_type' => $asset->mime_type,
            'size' => $asset->size,
            'url' => $asset->publicUrl(),
            'created_at' => $asset->created_at,
        ];
    }
}
