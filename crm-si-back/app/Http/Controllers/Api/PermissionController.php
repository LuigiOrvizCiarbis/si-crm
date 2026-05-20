<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\PermissionCatalog;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

class PermissionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->can('permissions.view'), 403);

        $groups = collect(PermissionCatalog::grouped())
            ->map(fn (array $items, string $resource) => [
                'resource' => $resource,
                'items' => array_values($items),
            ])
            ->values();

        return response()->json(['data' => $groups]);
    }
}
