<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorizeView($request);

        $query = Product::query()->orderBy('name');

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where(function ($q) use ($search) {
                $q->whereLike('name', "%{$search}%", caseSensitive: false)
                    ->orWhereLike('description', "%{$search}%", caseSensitive: false);
            });
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeManage($request);

        $validated = $request->validate($this->rules($request));

        $product = Product::create([
            ...$validated,
            'tenant_id' => $request->user()->tenant_id,
            'created_by' => $request->user()->id,
            'source' => 'manual',
        ]);

        return response()->json(['data' => $product], 201);
    }

    public function show(Request $request, Product $product): JsonResponse
    {
        $this->authorizeView($request);
        $this->authorizeTenant($request, $product->tenant_id);

        return response()->json(['data' => $product]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $this->authorizeManage($request);
        $this->authorizeTenant($request, $product->tenant_id);

        $validated = $request->validate($this->rules($request, $product));

        $product->update($validated);

        return response()->json(['data' => $product->refresh()]);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $this->authorizeManage($request);
        $this->authorizeTenant($request, $product->tenant_id);

        $product->delete();

        return response()->json(['message' => 'Producto eliminado']);
    }

    private function rules(Request $request, ?Product $product = null): array
    {
        return [
            'name' => [$product ? 'sometimes' : 'required', 'string', 'max:150'],
            'price' => ['nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'description' => ['nullable', 'string', 'max:5000'],
            'is_active' => ['boolean'],
        ];
    }

    private function authorizeView(Request $request): void
    {
        $user = $request->user();

        if (! $user?->can('products.view') && ! $user?->can('products.manage')) {
            abort(403);
        }
    }

    private function authorizeManage(Request $request): void
    {
        if (! $request->user()?->can('products.manage')) {
            abort(403);
        }
    }

    private function authorizeTenant(Request $request, int $tenantId): void
    {
        if ($tenantId !== $request->user()->tenant_id) {
            abort(403);
        }
    }
}
