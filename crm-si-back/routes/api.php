<?php

use App\Http\Controllers\Api\ChannelController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\ContactHistoryController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\ConversationStreamController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\PipelineStageController;
use App\Http\Controllers\Api\TenantStreamController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WhatsAppTemplateController;
use App\Http\Controllers\WhatsAppController;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;

Route::post('login', function (Request $request): JsonResponse {
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    $user = User::where('email', $request->email)->first();

    if (! $user || ! Hash::check($request->password, $user->password)) {
        return response()->json(['message' => 'Credenciales inválidas'], 401);
    }

    $token = $user->createToken('api-token')->plainTextToken;

    return response()->json([
        'token' => $token,
        'user' => $user,
        'email_verified' => $user->hasVerifiedEmail(),
    ]);
});

Route::post('register', function (Request $request): JsonResponse {
    $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'password' => ['required', 'confirmed', PasswordRule::min(8)],
    ]);

    // Crear tenant para el nuevo usuario
    $tenant = Tenant::create([
        'name' => $request->name."'s Workspace",
    ]);

    $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        'password' => Hash::make($request->password),
        'tenant_id' => $tenant->id,
    ]);

    // Enviar email de verificación automáticamente
    $user->sendEmailVerificationNotification();

    $token = $user->createToken('api-token')->plainTextToken;

    return response()->json([
        'token' => $token,
        'user' => $user,
        'email_verified' => false,
        'message' => 'Cuenta creada. Por favor verifica tu email.',
    ], 201);
});

// Verificar email con link firmado
Route::get('email/verify/{id}/{hash}', function (Request $request, $id, $hash): JsonResponse|RedirectResponse {
    $user = User::findOrFail($id);

    // Verificar que el hash coincide
    if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json(['message' => 'Link de verificación inválido'], 400);
        }
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');

        return redirect($frontendUrl.'/verify-email/confirm?error=invalid');
    }

    // Verificar la firma y expiración
    $expires = $request->query('expires');
    $signature = $request->query('signature');
    $appKey = config('app.key');

    $expectedSignature = hash_hmac('sha256', "{$id}/{$hash}?expires={$expires}", $appKey);

    if (! hash_equals($expectedSignature, $signature) || now()->timestamp > (int) $expires) {
        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json(['message' => 'El link de verificación ha expirado o es inválido'], 400);
        }
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');

        return redirect($frontendUrl.'/verify-email/confirm?error=expired');
    }

    if ($user->hasVerifiedEmail()) {
        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json(['message' => 'Email ya verificado', 'already' => true]);
        }
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');

        return redirect($frontendUrl.'/verify-email/confirm?already=true');
    }

    $user->markEmailAsVerified();
    event(new Verified($user));

    if ($request->wantsJson() || $request->is('api/*')) {
        return response()->json(['message' => 'Email verificado exitosamente', 'success' => true]);
    }

    $frontendUrl = config('app.frontend_url', 'http://localhost:3000');

    return redirect($frontendUrl.'/verify-email/confirm?success=true');
})->name('verification.verify');

// Reenviar email de verificación
Route::post('email/resend', function (Request $request) {
    $request->validate([
        'email' => 'required|email|exists:users,email',
    ]);

    $user = User::where('email', $request->email)->first();

    if ($user->hasVerifiedEmail()) {
        return response()->json(['message' => 'El email ya está verificado'], 400);
    }

    $user->sendEmailVerificationNotification();

    return response()->json([
        'message' => 'Email de verificación reenviado',
    ]);
});

// Cambiar email (si se equivocó al registrarse)
Route::middleware('auth:sanctum')->post('email/change', function (Request $request): JsonResponse {
    $request->validate([
        'email' => 'required|email|unique:users,email',
        'password' => 'required',
    ]);

    $user = $request->user();

    // Verificar contraseña
    if (! Hash::check($request->password, $user->password)) {
        return response()->json(['message' => 'Contraseña incorrecta'], 401);
    }

    // Cambiar email y marcar como no verificado
    $user->email = $request->email;
    $user->email_verified_at = null;
    $user->save();

    // Enviar nuevo email de verificación
    $user->sendEmailVerificationNotification();

    return response()->json([
        'user' => $user,
        'message' => 'Email actualizado. Por favor verifica el nuevo email.',
    ]);
});

Route::post('forgot-password', function (Request $request): JsonResponse {
    $request->validate([
        'email' => 'required|email|exists:users,email',
    ]);

    $status = Password::sendResetLink(
        $request->only('email')
    );

    if ($status === Password::RESET_LINK_SENT) {
        return response()->json([
            'message' => 'Te hemos enviado un correo con instrucciones para restablecer tu contraseña',
        ]);
    }

    return response()->json([
        'message' => 'No pudimos enviar el correo. Intenta de nuevo.',
    ], 400);
});

Route::post('reset-password', function (Request $request) {
    $request->validate([
        'token' => 'required',
        'email' => 'required|email',
        'password' => ['required', 'confirmed', PasswordRule::min(8)],
    ]);

    $status = Password::reset(
        $request->only('email', 'password', 'password_confirmation', 'token'),
        function ($user, $password) {
            $user->forceFill([
                'password' => Hash::make($password),
            ])->save();
        }
    );

    if ($status === Password::PASSWORD_RESET) {
        return response()->json([
            'message' => 'Contraseña restablecida exitosamente',
        ]);
    }

    return response()->json([
        'message' => 'No se pudo restablecer la contraseña. El enlace puede haber expirado.',
    ], 400);
});

Route::middleware('auth:sanctum')->group(function () {

    Route::get('user', function (Request $request): JsonResponse {
        return response()->json($request->user());
    });

    Route::post('logout', function (Request $request): JsonResponse {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada']);
    });

    Route::get('users', [UserController::class, 'index']);
    Route::get('users/{user}', [ContactController::class, 'show']);

    Route::get('contacts', [ContactController::class, 'index']);
    Route::get('contacts/{contact}', [ContactController::class, 'show']);
    Route::get('contacts/{contact}/history', [ContactHistoryController::class, 'show']);

    Route::get('conversations', [ConversationController::class, 'index']);
    Route::get('conversations/{conversation}', [ConversationController::class, 'show']);

    Route::get('messages', [MessageController::class, 'index']);
    Route::post('messages', [MessageController::class, 'store']);

    Route::get('channels', [ChannelController::class, 'index']);
    Route::get('channels/{id}/users', [ChannelController::class, 'users']);
    Route::post('channels/{id}/users', [ChannelController::class, 'addUser']);
    Route::delete('channels/{id}/users/{userId}', [ChannelController::class, 'removeUser']);
    Route::put('channels/{id}/users', [ChannelController::class, 'syncUsers']);

    Route::post('admin/channels/whatsapp-auth', [WhatsAppController::class, 'handleAuth']);

    Route::get('/conversations/{conversation}/stream', [ConversationStreamController::class, 'stream'])
        ->name('conversations.stream');

    Route::get('/tenant/stream', [TenantStreamController::class, 'stream'])
        ->name('tenant.stream');

    Route::get('/conversations/{id}/messages', [ConversationController::class, 'fetchMessages']);

    Route::apiResource('pipeline-stages', PipelineStageController::class);
    Route::post('pipeline-stages/reorder', [PipelineStageController::class, 'reorder']);
    Route::patch('conversations/{id}/stage', [ConversationController::class, 'updateStage']);

    Route::post('conversations/{id}/users', [ConversationController::class, 'assignUsers']);
    Route::post('conversations/{id}/users/add', [ConversationController::class, 'addUser']);
    Route::delete('conversations/{id}/users/{userId}', [ConversationController::class, 'removeUser']);

    Route::get('channels/{channel}/templates', [WhatsAppTemplateController::class, 'index']);
    Route::post('channels/{channel}/templates/sync', [WhatsAppTemplateController::class, 'sync']);
    Route::post('conversations/{conversation}/send-template', [WhatsAppTemplateController::class, 'send']);
});

Route::match(['get', 'post'], 'whatsapp-webhook', [WhatsAppController::class, 'webhook']);
