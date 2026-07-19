<?php

namespace App\Http\Controllers;

use App\Enums\ChannelType;
use App\Events\MessageStatusUpdated;
use App\Exceptions\ChannelAlreadyConnectedException;
use App\Http\Requests\ChannelStoreRequest;
use App\Models\Channel;
use App\Models\Message;
use App\Models\WhatsAppConfig;
use App\Services\WhatsAppMessageService;
use App\Support\MetaOAuth;
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
                        'Si el número ya tenía verificación en dos pasos configurada con un PIN propio, '.
                        'desactivala en la app de WhatsApp Business e intentá de nuevo.',
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
     *
     * @return array{exception: class-string<\Throwable>, message: string, file: string, line: int}
     */
    private function describeException(\Throwable $e): array
    {
        return MetaOAuth::describeException($e);
    }

    /**
     * Saca tokens y secretos de un mensaje libre antes de loguearlo.
     */
    private function scrubMessage(string $message): string
    {
        return MetaOAuth::scrubMessage($message);
    }

    /**
     * Extrae solo los campos seguros de un error de Graph API.
     *
     * @return array{code: int|null, type: string|null, subcode: int|null, message: string|null}
     */
    private function describeMetaError(?array $body): array
    {
        return MetaOAuth::describeMetaError($body);
    }

    private function exchangeCodeForToken(string $code): ?string
    {
        // El token del Embedded Signup nace con ~60 días de vida; el helper lo
        // extiende a long-lived antes de devolverlo.
        return MetaOAuth::exchangeCodeForToken($code);
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
                ->timeout(15)
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

        // Flujo coexistencia (WhatsApp Business App / SMB): Meta registra el número
        // solo durante el Embedded Signup. La doc dice explícitamente "skip the phone
        // number registration step as the number is already registered" y el endpoint
        // /register devuelve "Register endpoint is not available for SMB businesses".
        // Si el número ya está en la Business App, saltamos el register (éxito).
        if ($this->isOnBusinessApp($phoneNumberId, $token)) {
            Log::info('registerPhoneNumber: número en coexistencia (SMB), register omitido', [
                'phone_number_id' => $phoneNumberId,
            ]);

            return true;
        }

        // El endpoint /register exige siempre un `pin` de 6 dígitos (two-step
        // verification). En el alta de un número nuevo, ese PIN lo define el partner
        // (nosotros) y queda seteado como el two-step del número. Lo persistimos
        // porque en re-registros futuros Meta pedirá ese mismo PIN. Si ya hay uno
        // guardado lo reusamos; si no, generamos uno nuevo.
        $pin = $whatsAppConfig->getDecryptedRegistrationPin() ?? $this->generateRegistrationPin();

        try {
            $response = Http::withToken($token)
                ->timeout(15)
                ->post("https://graph.facebook.com/{$version}/{$phoneNumberId}/register", [
                    'messaging_product' => 'whatsapp',
                    'pin' => $pin,
                ]);

            if ($response->successful()) {
                $whatsAppConfig->setEncryptedRegistrationPin($pin);

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

            // Red de seguridad: si el chequeo is_on_biz_app falló o dio falso negativo
            // pero el número es SMB, Meta rechaza el register con este mensaje. Para
            // coexistencia el register no aplica → lo tratamos como éxito, no error.
            if (str_contains($errorMessage, 'not available for smb')) {
                Log::info('registerPhoneNumber: register no disponible para SMB, omitido (idempotente)', [
                    'phone_number_id' => $phoneNumberId,
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

    /**
     * Genera un PIN de 6 dígitos para la verificación en dos pasos del número.
     */
    private function generateRegistrationPin(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Indica si el número está conectado a la WhatsApp Business App (coexistencia/SMB).
     * En ese caso Meta ya lo registró y el endpoint /register no aplica.
     * Docs: GET /{phone_number_id}?fields=is_on_biz_app,platform_type
     *
     * Ante cualquier error de la consulta devuelve false: que el register lo intente
     * y, si es SMB, el manejo del error "not available for SMB" actúa de red de seguridad.
     */
    private function isOnBusinessApp(string $phoneNumberId, string $token): bool
    {
        $version = config('services.facebook.graph_version', 'v21.0');

        try {
            $response = Http::withToken($token)
                ->timeout(15)
                ->get("https://graph.facebook.com/{$version}/{$phoneNumberId}", [
                    'fields' => 'is_on_biz_app,platform_type',
                ]);

            if ($response->successful()) {
                return (bool) $response->json('is_on_biz_app', false);
            }

            Log::warning('isOnBusinessApp: no se pudo consultar el estado del número', [
                'status' => $response->status(),
                'error' => $this->describeMetaError($response->json()),
                'phone_number_id' => $phoneNumberId,
            ]);
        } catch (\Throwable $e) {
            Log::warning('isOnBusinessApp exception', $this->describeException($e));
        }

        return false;
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
                ->timeout(15)
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
                ->timeout(15)
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
                        $this->processStatusUpdates($value['statuses']);
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

    /**
     * Procesar los status updates que Meta envía por webhook (sent/delivered/
     * read/failed). El mensaje saliente se resuelve por su wamid, guardado en
     * `messages.external_id`. Antes esto solo se logueaba: un `failed` de Meta
     * (p. ej. template de documento sin filename) quedaba invisible y el mensaje
     * seguía figurando como enviado en el CRM.
     */
    private function processStatusUpdates(array $statuses): void
    {
        foreach ($statuses as $status) {
            $wamid = $status['id'] ?? null;
            $state = $status['status'] ?? null;

            if (! $wamid || ! $state) {
                continue;
            }

            $message = Message::where('external_id', $wamid)->first();

            if (! $message) {
                // El status puede llegar antes de que persistamos el mensaje, o
                // corresponder a un envío que no originamos. Dejamos rastro sin frenar.
                Log::info('WhatsApp status sin mensaje asociado', [
                    'wamid' => $wamid,
                    'status' => $state,
                ]);

                continue;
            }

            $changed = false;

            switch ($state) {
                case 'delivered':
                    if (! $message->isDelivered()) {
                        $message->markAsDelivered();
                        $changed = true;
                    }
                    break;

                case 'read':
                    // `read` implica entregado; completamos ambos si faltan.
                    if (! $message->isDelivered()) {
                        $message->markAsDelivered();
                        $changed = true;
                    }
                    if (! $message->isRead()) {
                        $message->markAsRead();
                        $changed = true;
                    }
                    break;

                case 'failed':
                    if (! $message->isFailed()) {
                        $error = $this->describeStatusError($status['errors'] ?? []);
                        $message->markAsFailed($error);
                        $changed = true;

                        Log::warning('WhatsApp message failed', [
                            'wamid' => $wamid,
                            'message_id' => $message->id,
                            'conversation_id' => $message->conversation_id,
                            'error' => $error,
                            'errors' => $status['errors'] ?? [],
                        ]);
                    }
                    break;

                    // `sent` no aporta más que el wamid que ya tenemos al crear el mensaje.
            }

            // Solo emitimos si el estado realmente cambió: Meta reenvía statuses
            // duplicados y no queremos spamear el canal ni re-renderizar el front.
            if ($changed && $message->conversation_id) {
                broadcast(new MessageStatusUpdated($message));
            }
        }
    }

    /**
     * Aplanar el array `errors[]` de un status `failed` de Meta a un string
     * legible para persistir en `messages.error_message` y mostrar en el CRM.
     * Shape del webhook: [{ code, title, message, error_data: { details } }].
     */
    private function describeStatusError(array $errors): ?string
    {
        $parts = [];

        foreach ($errors as $error) {
            $code = $error['code'] ?? null;
            $detail = $error['error_data']['details'] ?? $error['message'] ?? $error['title'] ?? null;

            $label = trim(($code !== null ? "[{$code}] " : '').(string) $detail);

            if ($label !== '') {
                $parts[] = $label;
            }
        }

        return $parts !== [] ? implode('; ', $parts) : null;
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
