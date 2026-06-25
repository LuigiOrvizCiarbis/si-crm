<?php

namespace App\Http\Controllers;

use App\Enums\ChannelType;
use App\Exceptions\ChannelAlreadyConnectedException;
use App\Http\Requests\ChannelStoreRequest;
use App\Models\Channel;
use App\Models\WhatsAppConfig;
use App\Services\WhatsAppMessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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
            if (! $businessToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se pudo obtener el token de Meta. Intentá de nuevo.',
                ], 502);
            }

            $channel = $this->saveChannel($request, $businessToken);
            $config = $channel->whatsappConfig;
            $warnings = [];

            // Registrar el número en Cloud API. Obligatorio en coexistencia
            // (featureType=whatsapp_business_app_onboarding): Meta crea y verifica
            // el número pero el register es nuestro. Sin él, las llamadas siguientes
            // devuelven 133010 "Account not registered" y el número no rutea.
            // Falla dura: no devolvemos success:true para que el front reintente.
            $registerOk = $this->registerPhoneNumber($config, $businessToken);
            if (! $registerOk) {
                Log::error('handleAuth: no se pudo registrar el número en Cloud API', [
                    'tenant_id' => $channel->tenant_id,
                    'phone_number_id' => $config->phone_number_id,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'No se pudo registrar el número en WhatsApp Cloud API. '.
                        'Si el número tiene verificación en dos pasos activada, desactivala en la app '.
                        'de WhatsApp Business e intentá de nuevo.',
                ], 422);
            }

            $webhookOk = $this->subscribeToWebhooks($config);
            if (! $webhookOk) {
                $warnings[] = 'No se pudo suscribir a los webhooks de Meta. Los mensajes entrantes pueden no llegar.';
            }

            // Inicia la sincronización de contactos del WA Business App.
            // Docs: hay una ventana de 24h y solo se puede hacer una vez por onboarding.
            $syncOk = $this->triggerContactSync($config, $businessToken);
            if (! $syncOk) {
                $warnings[] = 'No se pudo iniciar la sincronización de contactos. Contactá a soporte.';
            }

            return response()->json([
                'success' => true,
                'message' => 'Cuenta conectada exitosamente',
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

        } catch (ChannelAlreadyConnectedException $e) {
            // 409 cuando el número ya está conectado por otro usuario del mismo tenant
            Log::warning('handleAuth: número ya conectado por otro usuario del tenant', [
                'tenant_id' => $e->tenantId,
                'existing_user_id' => $e->existingUserId,
                'requesting_user' => $e->requestingUserId,
                'phone_number_id' => $e->phoneNumberId,
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 409);

        } catch (\Exception $e) {
            // No loguear getTraceAsString(): el stack trace de PHP serializa los
            // argumentos de cada frame, lo que filtraría $businessToken en claro.
            Log::error('handleAuth: error interno', $this->describeException($e));

            return response()->json([
                'success' => false,
                'message' => 'Error interno al procesar la solicitud.',
            ], 500);
        }
    }

    /**
     * Resume una excepción a campos seguros para loguear.
     * Evita getTraceAsString() (filtra args de método) y getMessage() crudo
     * cuando la excepción puede contener URLs con secretos (Guzzle).
     *
     * @return array{exception: class-string<\Throwable>, message: string, file: string, line: int}
     */
    private function describeException(\Throwable $e): array
    {
        return [
            'exception' => $e::class,
            'message' => $this->scrubMessage($e->getMessage()),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ];
    }

    /**
     * Saca tokens y secretos de un mensaje libre antes de loguearlo.
     * Cubre los formatos típicos de Guzzle/Meta: query strings con `code=`,
     * `access_token=`, `client_secret=`, y headers `Bearer ...`.
     */
    private function scrubMessage(string $message): string
    {
        $patterns = [
            '/(client_secret|access_token|code|bussines_token|business_token)=[^\s&"\']+/i' => '$1=[REDACTED]',
            '/Bearer\s+[A-Za-z0-9._\-]+/i' => 'Bearer [REDACTED]',
        ];

        return preg_replace(array_keys($patterns), array_values($patterns), $message) ?? '[unloggable]';
    }

    /**
     * Extrae solo los campos seguros de un error de Graph API.
     * El body crudo puede contener `fbtrace_id`, payloads o eco de credenciales.
     *
     * @return array{code: int|null, type: string|null, subcode: int|null, message: string|null}
     */
    private function describeMetaError(?array $body): array
    {
        return [
            'code' => data_get($body, 'error.code'),
            'type' => data_get($body, 'error.type'),
            'subcode' => data_get($body, 'error.error_subcode'),
            'message' => data_get($body, 'error.message'),
        ];
    }

    private function exchangeCodeForToken(string $code): ?string
    {
        try {
            $response = Http::get('https://graph.facebook.com/v21.0/oauth/access_token', [
                'client_id' => config('services.facebook.app_id'),
                'client_secret' => config('services.facebook.app_secret'),
                'code' => $code,
            ]);

            if ($response->successful()) {
                $token = $response->json('access_token');

                // El token del Embedded Signup nace con ~60 días de vida.
                // Lo convertimos a permanente (expires_at=0) antes de persistirlo,
                // así el cliente no se cae a los 60 días del onboarding.
                return $this->extendTokenToPermanent($token);
            }

            Log::error('Token exchange failed', [
                'status' => $response->status(),
                'error' => $this->describeMetaError($response->json()),
            ]);
        } catch (\Exception $e) {
            // getMessage() de Guzzle puede incluir la URL completa con
            // ?client_secret=...&code=..., por eso pasa por scrubMessage.
            Log::error('Exception exchanging code for token', $this->describeException($e));
        }

        return null;
    }

    private function extendTokenToPermanent(string $token): string
    {
        try {
            $response = Http::get('https://graph.facebook.com/v21.0/oauth/access_token', [
                'grant_type' => 'fb_exchange_token',
                'client_id' => config('services.facebook.app_id'),
                'client_secret' => config('services.facebook.app_secret'),
                'fb_exchange_token' => $token,
            ]);

            if ($response->successful() && $response->json('access_token')) {
                return $response->json('access_token');
            }

            Log::warning('No se pudo extender el token a permanente, se usa el de 60 días', [
                'status' => $response->status(),
                'error' => $this->describeMetaError($response->json()),
            ]);
        } catch (\Exception $e) {
            Log::warning('Excepción extendiendo token a permanente', $this->describeException($e));
        }

        return $token;
    }

    private function saveChannel(Request $request, string $businessToken): Channel
    {
        $user = $request->user();

        if (! $user) {
            throw new \Exception('Usuario no autenticado');
        }

        $wabaId = $request->data['waba_id'] ?? null;
        $phoneNumberId = $request->data['phone_number_id'] ?? null;

        // Paso 1: obtener datos del número de teléfono desde la Graph API.
        // Siempre intentamos para obtener display_phone_number, y si no teníamos
        // phone_number_id (flujo coexistencia), lo obtenemos también.
        $displayPhoneNumber = null;
        if ($wabaId) {
            $phoneData = $this->fetchFirstPhoneNumber($wabaId, $businessToken);
            if ($phoneData) {
                if (! $phoneNumberId) {
                    $phoneNumberId = $phoneData['id'] ?? null;
                }
                $displayPhoneNumber = $phoneData['display_phone_number'] ?? null;
            }
        }

        // Paso 2: si la API de Meta falló (fallo transitorio / re-auth), recuperar
        // el phone_number_id del registro existente en DB para no bloquear al usuario.
        // Nota: el match incluye phone_number_id no nulo solamente para tener un
        // fallback útil; un WABA con varios números obliga a la API de Meta de todos modos.
        if (! $phoneNumberId && $wabaId) {
            $existing = WhatsAppConfig::where('waba_id', $wabaId)
                ->whereNotNull('phone_number_id')
                ->first();

            if ($existing) {
                $phoneNumberId = $existing->phone_number_id;
                Log::info('saveChannel: phone_number_id recuperado de config existente (re-auth)', [
                    'waba_id' => $wabaId,
                    'phone_number_id' => $phoneNumberId,
                ]);
            }
        }

        // Paso 3: sin phone_number_id el canal no puede rutear mensajes → error 422.
        if (! $phoneNumberId) {
            throw new \InvalidArgumentException(
                'No se pudo obtener el número de teléfono de Meta. '.
                'Verificá los permisos del token o intentá de nuevo.'
            );
        }

        // Paso 4: validar ownership ANTES de escribir credenciales.
        // Si ya existe una WhatsAppConfig para (waba_id, phone_number_id) con un
        // Channel del tenant cuyo dueño es otro usuario, se rechaza con 409 sin
        // sobrescribir el token. Reasignar el dueño es una feature admin separada.
        $existingConfig = WhatsAppConfig::where('waba_id', $wabaId)
            ->where('phone_number_id', $phoneNumberId)
            ->first();

        $existingChannel = null;
        if ($existingConfig) {
            $existingChannel = Channel::where('tenant_id', $user->tenant_id)
                ->where('type', ChannelType::WHATSAPP)
                ->where('whatsapp_config_id', $existingConfig->id)
                ->first();

            if ($existingChannel && $existingChannel->user_id !== $user->id) {
                throw new ChannelAlreadyConnectedException(
                    tenantId: $user->tenant_id,
                    existingUserId: (int) $existingChannel->user_id,
                    requestingUserId: $user->id,
                    phoneNumberId: $phoneNumberId,
                );
            }
        }

        // Paso 5: persistir/actualizar la WhatsAppConfig.
        // El match es por (waba_id, phone_number_id): identifica un número real en Meta.
        // Cambiar de phone_number_id (segundo número del mismo WABA, o WABA distinto)
        // crea una config nueva en lugar de pisar el token del número anterior.
        $updateData = ['bussines_token' => Crypt::encryptString($businessToken)];
        if ($displayPhoneNumber) {
            $updateData['display_phone_number'] = $displayPhoneNumber;
        }

        $whatsappConfig = WhatsAppConfig::updateOrCreate(
            [
                'waba_id' => $wabaId,
                'phone_number_id' => $phoneNumberId,
            ],
            $updateData
        );

        // Paso 6: resolver el Channel del tenant para esa config.
        if ($existingChannel) {
            $existingChannel->fill(['status' => 'active'])->save();

            return $existingChannel;
        }

        return Channel::create([
            'tenant_id' => $user->tenant_id,
            'user_id' => $user->id,
            'whatsapp_config_id' => $whatsappConfig->id,
            'type' => ChannelType::WHATSAPP,
            'name' => $request->input('name', 'WhatsApp Business'),
            'status' => 'active',
        ]);
    }

    /**
     * Obtiene el ID del primer número de teléfono del WABA vía Graph API.
     * Se usa en el flujo de coexistencia donde Meta no devuelve phone_number_id.
     *
     * Advertencia: si el WABA tiene más de un número, se toma el primero.
     * En ese caso habría que agregar UI para que el usuario elija.
     */
    private function fetchFirstPhoneNumber(string $wabaId, string $token): ?array
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
                        'count' => count($numbers),
                    ]);
                }

                return $numbers[0] ?? null;
            }

            Log::error('fetchFirstPhoneNumberId failed', [
                'status' => $response->status(),
                'error' => $this->describeMetaError($response->json()),
            ]);
        } catch (\Throwable $e) {
            Log::error('fetchFirstPhoneNumberId exception', $this->describeException($e));
        }

        return null;
    }

    private function registerPhoneNumber(WhatsAppConfig $whatsAppConfig, string $token): bool
    {
        $phoneNumberId = $whatsAppConfig->phone_number_id;

        if (! $phoneNumberId) {
            Log::warning('registerPhoneNumber: phone_number_id no disponible, registro omitido');

            return false;
        }

        $version = config('services.facebook.graph_version', 'v21.0');

        try {
            $response = Http::withToken($token)
                ->post("https://graph.facebook.com/{$version}/{$phoneNumberId}/register", [
                    'messaging_product' => 'whatsapp',
                ]);

            if ($response->successful()) {
                Log::info('registerPhoneNumber: número registrado en Cloud API', [
                    'phone_number_id' => $phoneNumberId,
                ]);

                return true;
            }

            $body = $response->json();
            $errorCode = data_get($body, 'error.code');
            $errorMessage = strtolower((string) data_get($body, 'error.message', ''));

            $alreadyRegistered = in_array($errorCode, [133015], true)
                || str_contains($errorMessage, 'already registered')
                || str_contains($errorMessage, 'already been registered');

            if ($alreadyRegistered) {
                Log::info('registerPhoneNumber: número ya estaba registrado (idempotente)', [
                    'phone_number_id' => $phoneNumberId,
                    'error_code' => $errorCode,
                ]);

                return true;
            }

            Log::error('registerPhoneNumber failed', [
                'status' => $response->status(),
                'error' => $this->describeMetaError($body),
                'phone_number_id' => $phoneNumberId,
            ]);

            return false;
        } catch (\Throwable $e) {
            Log::error('registerPhoneNumber exception', $this->describeException($e));

            return false;
        }
    }

    private function subscribeToWebhooks(WhatsAppConfig $whatsAppConfig): bool
    {
        $wabaId = $whatsAppConfig->waba_id;

        if (! $wabaId) {
            Log::warning('subscribeToWebhooks: WABA ID ausente');

            return false;
        }

        $token = $whatsAppConfig->getDecryptedToken();

        if (! $token) {
            Log::error('subscribeToWebhooks: no se pudo descifrar el token');

            return false;
        }

        $version = config('services.facebook.graph_version', 'v21.0');

        try {
            $response = Http::withToken($token)
                ->post("https://graph.facebook.com/{$version}/{$wabaId}/subscribed_apps");

            if (! $response->successful()) {
                Log::error('subscribeToWebhooks failed', [
                    'status' => $response->status(),
                    'error' => $this->describeMetaError($response->json()),
                ]);

                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::error('subscribeToWebhooks exception', $this->describeException($e));

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

        if (! $phoneNumberId) {
            Log::warning('triggerContactSync: phone_number_id no disponible, sync omitida');

            return false;
        }

        $version = config('services.facebook.graph_version', 'v21.0');

        try {
            $response = Http::withToken($token)
                ->post("https://graph.facebook.com/{$version}/{$phoneNumberId}/smb_app_data", [
                    'messaging_product' => 'whatsapp',
                    'sync_type' => 'smb_app_state_sync',
                ]);

            if ($response->successful()) {
                Log::info('triggerContactSync: sincronización de contactos iniciada', [
                    'phone_number_id' => $phoneNumberId,
                ]);

                return true;
            }

            // 400: puede ser "ya sincronizado antes" (esperado) u otro error real.
            // Validamos el mensaje para no ocultar 400s por payload/permisos inválidos.
            if ($response->status() === 400) {
                $body = $response->json();
                $errorCode = data_get($body, 'error.code');
                $errorSubcode = data_get($body, 'error.error_subcode');
                $errorMessage = strtolower((string) data_get($body, 'error.message', ''));

                $alreadySynced = str_contains($errorMessage, 'already')
                    && str_contains($errorMessage, 'smb_app_data');

                if ($alreadySynced) {
                    Log::info('triggerContactSync: sync ya realizada previamente (400 esperado)', [
                        'phone_number_id' => $phoneNumberId,
                        'error_code' => $errorCode,
                        'error_subcode' => $errorSubcode,
                    ]);

                    return true;
                }

                Log::warning('triggerContactSync: 400 inesperado de Meta', [
                    'phone_number_id' => $phoneNumberId,
                    'error' => $this->describeMetaError($body),
                ]);

                return false;
            }

            Log::warning('triggerContactSync: respuesta inesperada de Meta', [
                'status' => $response->status(),
                'error' => $this->describeMetaError($response->json()),
                'phone_number_id' => $phoneNumberId,
            ]);

            return false;

        } catch (\Throwable $e) {
            Log::error('triggerContactSync exception', $this->describeException($e));

            return false;
        }
    }

    public function webhook(Request $request): Response|JsonResponse
    {
        $mode = $request->query('hub_mode', $request->query('hub.mode'));
        $challenge = $request->query('hub_challenge', $request->query('hub.challenge'));
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

                    if ($field === 'messages' && isset($value['statuses'])) {
                        Log::info('WhatsApp status update', ['statuses' => $value['statuses']]);
                    }

                    if ($field === 'messages' && isset($value['messages'])) {
                        $this->messageService->processIncomingMessage($change);

                    } elseif ($field === 'smb_message_echoes' && isset($value['message_echoes'])) {
                        $this->messageService->processSmbMessageEchoes($change);

                    } elseif ($field === 'smb_app_state_sync') {
                        $this->handleSmbAppStateSync($entry['id'] ?? null, $value);
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::error('Error processing webhook', $this->describeException($e));
        }

        return response()->json(['status' => 'EVENT_RECEIVED'], 200);
    }

    private function handleSmbAppStateSync(?string $wabaId, array $value): void
    {
        $phoneNumberId = $value['metadata']['phone_number_id'] ?? null;
        $whatsappConfig = null;

        if ($phoneNumberId) {
            $whatsappConfig = WhatsAppConfig::with('channels')
                ->where('phone_number_id', $phoneNumberId)
                ->first();
        }

        if (! $whatsappConfig && $wabaId) {
            $whatsappConfig = WhatsAppConfig::with('channels')
                ->where('waba_id', $wabaId)
                ->first();
        }

        if (! $whatsappConfig || $whatsappConfig->channels->isEmpty()) {
            Log::warning('smb_app_state_sync: canal no encontrado', [
                'waba_id' => $wabaId,
                'phone_number_id' => $phoneNumberId,
            ]);

            return;
        }

        $tenantId = $whatsappConfig->channels->first()->tenant_id;
        $this->messageService->processSmbAppStateSync($value, $tenantId);
    }
}
