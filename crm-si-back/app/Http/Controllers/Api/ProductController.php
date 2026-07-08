<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImportProductsRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ProductField;
use App\Rules\ValidProductCustomData;
use App\Services\ProductImportService;
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

        $customFilter = $request->query('custom');
        if (is_array($customFilter) && $customFilter !== []) {
            $allowedKeys = ProductField::forCurrentTenant()->pluck('key')->all();
            foreach ($customFilter as $key => $value) {
                if (! is_string($key) || ! in_array($key, $allowedKeys, true) || $value === null || $value === '') {
                    continue;
                }
                $query->whereCustomField($key, $value);
            }
        }

        return ProductResource::collection($query->get())->response();
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

        return (new ProductResource($product))->response()->setStatusCode(201);
    }

    public function show(Request $request, Product $product): JsonResponse
    {
        $this->authorizeView($request);
        $this->authorizeTenant($request, $product->tenant_id);

        return (new ProductResource($product))->response();
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $this->authorizeManage($request);
        $this->authorizeTenant($request, $product->tenant_id);

        $providedCustomKeys = array_keys((array) $request->input('custom_data', []));

        $validated = $request->validate($this->rules($request, $product, $providedCustomKeys));

        if (array_key_exists('custom_data', $validated)) {
            $validated['custom_data'] = array_replace(
                $product->custom_data ?? [],
                $validated['custom_data'] ?? [],
            );
        }

        $product->update($validated);

        return (new ProductResource($product->refresh()))->response();
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $this->authorizeManage($request);
        $this->authorizeTenant($request, $product->tenant_id);

        $product->delete();

        return response()->json(['message' => 'Producto eliminado']);
    }

    public function import(ImportProductsRequest $request): JsonResponse
    {
        $this->authorizeManage($request);

        $mapping = $request->decodedMapping();
        $user = $request->user();

        $service = new ProductImportService;
        $result = $service->import($request->file('file'), $mapping, $user->tenant_id, $user->id);

        return response()->json(['data' => $result]);
    }

    private function rules(Request $request, ?Product $product = null, ?array $providedCustomKeys = null): array
    {
        return [
            'name' => [$product ? 'sometimes' : 'required', 'string', 'max:150'],
            'price' => ['nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'description' => ['nullable', 'string', 'max:5000'],
            'is_active' => ['boolean'],
            'custom_data' => ['nullable', 'array', new ValidProductCustomData($product?->id, $providedCustomKeys)],
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
