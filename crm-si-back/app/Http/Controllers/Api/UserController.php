<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $users = User::all();

        return response()->json(['data' => $users]);
    }

    // Mostrar un usuario específico
    public function show(Request $request, $id)
    {
        $user = User::findOrFail($id);

        return response()->json(['data' => $user]);
    }
}
