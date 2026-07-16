<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Symfony\Component\HttpFoundation\JsonResponse;

class PlanController extends Controller
{
    public function index(): JsonResponse
    {
        $plans = Plan::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'key', 'name', 'price_monthly', 'limits']);

        return response()->json(['data' => $plans]);
    }
}
