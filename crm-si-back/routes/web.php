<?php

use App\Http\Controllers\WhatsappController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => config('app.name'),
        'status' => 'running',
    ]);
});


// Webhooks públicos
Route::match(['get', 'post'], 'whatsapp-webhook', [WhatsappController::class, 'webhook']);
