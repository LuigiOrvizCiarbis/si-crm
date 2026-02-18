<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;
use App\Models\Channel;
use App\Enums\ChannelType;
use App\Http\Requests\ChannelStoreRequest;
use App\Models\WhatsAppConfig;
use App\Services\WhatsAppMessageService;

class WhatsAppController extends Controller
{

    public function __construct(
        private WhatsAppMessageService $messageService
    ) {}

    public function handleAuth(ChannelStoreRequest $request): JsonResponse
    {
        try {
            // 502 si Meta no responde o rechaza el code
            $businessToken = $this->exchangeCodeForToken($request->code);
            if (!$businessToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se pudo obtener el token de Meta. Intentá de nuevo.',
                ], 502);
            }

            $channel  = $this->saveChannel($request, $businessToken);
            $config   = $channel->whatsappConfig;
            $warnings = [];

            $webhookOk = $this->subscribeToWebhooks($config);
            if (!$webhookOk) {
                $warnings[] = 'No se pudo suscribir a los webhooks de Meta. Los mensajes entrantes pueden no llegar.';
            }

            // Inicia la sincronización de contactos del WA Business App.
            // Docs: hay una ventana de 24h y solo se puede hacer una vez por onboarding.
            $syncOk = $this->triggerContactSync($config, $businessToken);
            if (!$syncOk) {
                $warnings[] = 'No se pudo iniciar la sincronización de contactos. Contactá a soporte.';
            }

            return response()->json([
                'success'  => true,
                'message'  => 'Cuenta conectada exitosamente',
                'warnings' => $warnings,
            ], 200);

        } catch (\InvalidArgumentException $e) {
            // 422 cuando no se puede obtener el phone_number_id (error de negocio, no interno)
            Log::warning('handleAuth: phone_number_id no disponible', [
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);

        } catch (\Exception $e) {
            Log::error('handleAuth: error interno', [
                'exception' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error interno al procesar la solicitud.',
            ], 500);
        }
    }

    private function exchangeCodeForToken(string $code): ?string
    {
        try {
            $response = Http::get('https://graph.facebook.com/v21.0/oauth/access_token', [
                'client_id'     => config('services.facebook.app_id'),
                'client_secret' => config('services.facebook.app_secret'),
                'code'          => $code,
            ]);

            if ($response->successful()) {
                return $response->json('access_token');
            }

            Log::error('Token exchange failed', [
                'status' => $response->status(),
                'error'  => $response->json(),
            ]);
        } catch (\Exception $e) {
            Log::error('Exception exchanging code for token: ' . $e->getMessage());
        }

        return null;
    }

    private function saveChannel(Request $request, string $businessToken): Channel
    {
        $user = $request->user();

        if (!$user) {
            throw new \Exception('Usuario no autenticado');
        }

        $wabaId        = $request->data['waba_id'] ?? null;
        $phoneNumberId = $request->data['phone_number_id'] ?? null;

        // Paso 1: flujo de coexistencia — Meta no devuelve phone_number_id en el evento.
        if (!$phoneNumberId && $wabaId) {
            $phoneNumberId = $this->fetchFirstPhoneNumberId($wabaId, $businessToken);
        }

        // Paso 2: si la API de Meta falló (fallo transitorio / re-auth), recuperar
        // el phone_number_id del registro existente en DB para no bloquear al usuario.
        if (!$phoneNumberId && $wabaId) {
            $existing = WhatsAppConfig::where('waba_id', $wabaId)
                ->whereNotNull('phone_number_id')
                ->first();

            if ($existing) {
                $phoneNumberId = $existing->phone_number_id;
                Log::info('saveChannel: phone_number_id recuperado de config existente (re-auth)', [
                    'waba_id'         => $wabaId,
                    'phone_number_id' => $phoneNumberId,
                ]);
            }
        }

        // Paso 3: sin phone_number_id el canal no puede rutear mensajes → error 422.
        if (!$phoneNumberId) {
            throw new \InvalidArgumentException(
                'No se pudo obtener el número de teléfono de Meta. ' .
                'Verificá los permisos del token o intentá de nuevo.'
            );
        }

        $channel = Channel::updateOrCreate(
            ['tenant_id' => $user->tenant_id],
            [
                'user_id' => $user->id,
                'type'    => ChannelType::WHATSAPP,
                'name'    => $request->input('name', 'WhatsApp Business'),
                'status'  => 'active',
            ]
        );

        // Solo actualizamos phone_number_id si lo tenemos, para no pisar un valor
        // válido existente con null en un re-auth donde el fetch pueda fallar.
        $updateData = ['bussines_token' => Crypt::encryptString($businessToken)];
        if ($phoneNumberId) {
            $updateData['phone_number_id'] = $phoneNumberId;
        }

        $whatsappConfig = WhatsAppConfig::updateOrCreate(
            ['waba_id' => $wabaId],
            $updateData
        );

        $channel->whatsapp_config_id = $whatsappConfig->id;
        $channel->save();

        return $channel;
    }

    /**
     * Obtiene el ID del primer número de teléfono del WABA vía Graph API.
     * Se usa en el flujo de coexistencia donde Meta no devuelve phone_number_id.
     *
     * Advertencia: si el WABA tiene más de un número, se toma el primero.
     * En ese caso habría que agregar UI para que el usuario elija.
     */
    private function fetchFirstPhoneNumberId(string $wabaId, string $token): ?string
    {
        $version = config('services.facebook.graph_version', 'v21.0');

        try {
            $response = Http::withToken($token)
                ->get("https://graph.facebook.com/{$version}/{$wabaId}/phone_numbers", [
                    'fields' => 'id,display_phone_number,verified_name',
                ]);

            if ($response->successful()) {
                $numbers = $response->json('data', []);

                if (count($numbers) > 1) {
                    Log::warning('fetchFirstPhoneNumberId: WABA tiene múltiples números, se tomó el primero', [
                        'waba_id' => $wabaId,
                        'count'   => count($numbers),
                    ]);
                }

                return $numbers[0]['id'] ?? null;
            }

            Log::error('fetchFirstPhoneNumberId failed', [
                'status' => $response->status(),
                'body'   => $response->json(),
            ]);
        } catch (\Throwable $e) {
            Log::error('fetchFirstPhoneNumberId exception: ' . $e->getMessage());
        }

        return null;
    }

    private function subscribeToWebhooks(WhatsAppConfig $whatsAppConfig): bool
    {
        $wabaId = $whatsAppConfig->waba_id;

        if (!$wabaId) {
            Log::warning('subscribeToWebhooks: WABA ID ausente');
            return false;
        }

        $token = $whatsAppConfig->getDecryptedToken();

        if (!$token) {
            Log::error('subscribeToWebhooks: no se pudo descifrar el token');
            return false;
        }

        $version = config('services.facebook.graph_version', 'v21.0');

        try {
            $response = Http::withToken($token)
                ->post("https://graph.facebook.com/{$version}/{$wabaId}/subscribed_apps");

            if (!$response->successful()) {
                Log::error('subscribeToWebhooks failed', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::error('subscribeToWebhooks exception: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Dispara la sincronización inicial de contactos del WhatsApp Business App.
     *
     * Docs Meta: "You have a 24-hour window to synchronize contacts and messaging
     * history. Failure to do so will require the customer to be offboarded."
     * "This step can only be performed once."
     *
     * @see https://developers.facebook.com/docs/whatsapp/embedded-signup/onboarding-business-app-users
     */
    private function triggerContactSync(WhatsAppConfig $whatsAppConfig, string $token): bool
    {
        $phoneNumberId = $whatsAppConfig->phone_number_id;

        if (!$phoneNumberId) {
            Log::warning('triggerContactSync: phone_number_id no disponible, sync omitida');
            return false;
        }

        $version = config('services.facebook.graph_version', 'v21.0');

        try {
            $response = Http::withToken($token)
                ->post("https://graph.facebook.com/{$version}/{$phoneNumberId}/smb_app_data");

            if ($response->successful()) {
                Log::info('triggerContactSync: sincronización de contactos iniciada', [
                    'phone_number_id' => $phoneNumberId,
                ]);
                return true;
            }

            // 400: puede ser "ya sincronizado antes" (esperado) u otro error real.
            // Validamos el mensaje para no ocultar 400s por payload/permisos inválidos.
            if ($response->status() === 400) {
                $body         = $response->json();
                $errorCode    = data_get($body, 'error.code');
                $errorSubcode = data_get($body, 'error.error_subcode');
                $errorMessage = strtolower((string) data_get($body, 'error.message', ''));

                $alreadySynced = str_contains($errorMessage, 'already')
                    && str_contains($errorMessage, 'smb_app_data');

                if ($alreadySynced) {
                    Log::info('triggerContactSync: sync ya realizada previamente (400 esperado)', [
                        'phone_number_id' => $phoneNumberId,
                        'error_code'      => $errorCode,
                        'error_subcode'   => $errorSubcode,
                    ]);
                    return true;
                }

                Log::warning('triggerContactSync: 400 inesperado de Meta', [
                    'phone_number_id' => $phoneNumberId,
                    'body'            => $body,
                ]);
                return false;
            }

            Log::warning('triggerContactSync: respuesta inesperada de Meta', [
                'status'          => $response->status(),
                'body'            => $response->json(),
                'phone_number_id' => $phoneNumberId,
            ]);
            return false;

        } catch (\Throwable $e) {
            Log::error('triggerContactSync exception: ' . $e->getMessage());
            return false;
        }
    }

    public function webhook(Request $request): Response|JsonResponse
    {
        $mode        = $request->query('hub_mode', $request->query('hub.mode'));
        $challenge   = $request->query('hub_challenge', $request->query('hub.challenge'));
        $verifyToken = $request->query('hub_verify_token', $request->query('hub.verify_token'));

        if ($mode === 'subscribe') {
            $expected = config('services.facebook.verify_token', 'embbebedsecret');
            if ($verifyToken && hash_equals($expected, $verifyToken)) {
                return response($challenge, 200)->header('Content-Type', 'text/plain');
            }
            return response()->json(['error' => 'Verification token mismatch'], 403);
        }

        try {
            foreach ($request->input('entry', []) as $entry) {
                foreach ($entry['changes'] ?? [] as $change) {
                    $field = $change['field'] ?? '';
                    $value = $change['value'] ?? [];

                    if ($field === 'messages' && isset($value['messages'])) {
                        $this->messageService->processIncomingMessage($change);

                    } elseif ($field === 'smb_app_state_sync') {
                        $this->handleSmbAppStateSync($entry['id'] ?? null, $value);
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::error('Error processing webhook: ' . $e->getMessage());
        }

        return response()->json(['status' => 'EVENT_RECEIVED'], 200);
    }

    private function handleSmbAppStateSync(?string $wabaId, array $value): void
    {
        $phoneNumberId  = $value['metadata']['phone_number_id'] ?? null;
        $whatsappConfig = null;

        if ($phoneNumberId) {
            $whatsappConfig = WhatsAppConfig::with('channels')
                ->where('phone_number_id', $phoneNumberId)
                ->first();
        }

        if (!$whatsappConfig && $wabaId) {
            $whatsappConfig = WhatsAppConfig::with('channels')
                ->where('waba_id', $wabaId)
                ->first();
        }

        if (!$whatsappConfig || $whatsappConfig->channels->isEmpty()) {
            Log::warning('smb_app_state_sync: canal no encontrado', [
                'waba_id'         => $wabaId,
                'phone_number_id' => $phoneNumberId,
            ]);
            return;
        }

        $tenantId = $whatsappConfig->channels->first()->tenant_id;
        $this->messageService->processSmbAppStateSync($value, $tenantId);
    }
}
