<?php

use App\Http\Controllers\WhatsappController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});


// Webhooks públicos
Route::match(['get', 'post'], 'whatsapp-webhook', [WhatsappController::class, 'webhook']);
