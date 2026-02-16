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
use App\Models\Tenant;
use App\Models\User;
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

            $code = $request->code;

            $businessToken = $this->exchangeCodeForToken($code);

            if ($businessToken) {

                $channel = $this->saveChannel($request, $businessToken);

                $this->subscribeToWebhooks($channel->whatsappConfig);
            }

            return response()->json([
                'success' => true,
                'message' => 'Cuenta conectada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error en handleAuth: ' . $e->getMessage(), [
                'exception' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error processing request: ' . $e->getMessage()
            ], 500);
        }
    }

    private function exchangeCodeForToken(string $code): ?string
    {
        try {
            $appId = config('services.facebook.app_id');
            $appSecret = config('services.facebook.app_secret');

            $response = Http::get('https://graph.facebook.com/v21.0/oauth/access_token', [
                'client_id' => $appId,
                'client_secret' => $appSecret,
                'code' => $code,
            ]);


            if ($response->successful()) {
                $data = $response->json();
                $accessToken = $data['access_token'] ?? null;

                if ($accessToken) {
                    return $accessToken;
                } else {
                    Log::warning('No access token in response', ['data' => $data]);
                }
            } else {
                Log::error('Token exchange failed', [
                    'status' => $response->status(),
                    'error' => $response->json()
                ]);
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Exception exchanging code for token', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }


    private function saveChannel(Request $request, string $businessToken): Channel
    {

        $user = $request->user();

        if (!$user) {
            throw new \Exception('Usuario no autenticado');
        }

        $name = $request->input('name', 'WhatsApp Business');

        $encryptedToken = Crypt::encryptString($businessToken);

        $channel = Channel::updateOrCreate(
            [
                'tenant_id' => $user->tenant_id,
            ],
            [
                'user_id' => $user->id,
                'type' => ChannelType::WHATSAPP,
                'name' => $name,
                'status' => 'active',
            ]
        );

        $whatsappConfig = WhatsAppConfig::updateOrCreate(
            [
                'phone_number_id' => $request->data['phone_number_id'],
                'waba_id' => $request->data['waba_id'],
            ],
            [
                'bussines_token' => $encryptedToken,
            ]
        );

        $channel->whatsapp_config_id = $whatsappConfig->id;
        $channel->save();

        return $channel;
    }


    private function subscribeToWebhooks(WhatsAppConfig $whatsAppConfig): array
    {
        $wabaId = $whatsAppConfig->waba_id;
        if (!$wabaId) {
            Log::warning('subscribeToWebhooks: channel without external_id (WABA ID)');
            return ['success' => false, 'status' => 400, 'error' => 'missing_waba_id'];
        }

        try {
            $token = Crypt::decryptString($whatsAppConfig->bussines_token);
        } catch (\Throwable $e) {
            Log::error('subscribeToWebhooks: cannot decrypt access token: ' . $e->getMessage());
            return ['success' => false, 'status' => 500, 'error' => 'token_decrypt_failed'];
        }

        $version = config('services.facebook.graph_version', 'v21.0');
        $url = sprintf('https://graph.facebook.com/%s/%s/subscribed_apps', $version, $wabaId);

        try {
            $response = Http::withToken($token)->post($url);
            $ok = $response->successful();
            if (!$ok) {
                Log::error('subscribeToWebhooks failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'url' => $url,
                ]);
            }
            return [
                'success' => $ok,
                'status' => $response->status(),
                'body' => $response->json(),
            ];
        } catch (\Throwable $e) {
            Log::error('subscribeToWebhooks exception: ' . $e->getMessage());
            return ['success' => false, 'status' => 500, 'error' => 'request_failed'];
        }
    }

    public function webhook(Request $request): Response|JsonResponse
    {
        $mode = $request->query('hub_mode', $request->query('hub.mode'));
        $challenge = $request->query('hub_challenge', $request->query('hub.challenge'));
        $verifyToken = $request->query('hub_verify_token', $request->query('hub.verify_token'));

        $expectedToken = config('services.facebook.verify_token', 'embbebedsecret');

        if ($mode === 'subscribe') {
            if ($verifyToken && hash_equals($expectedToken, $verifyToken)) {
                return response($challenge, 200)->header('Content-Type', 'text/plain');
            }
            return response()->json(['error' => 'Verification token mismatch'], 403);
        }

        try {
            $payload = $request->all();

            if (isset($payload['entry'])) {
                foreach ($payload['entry'] as $entry) {
                    if (isset($entry['changes'])) {
                        foreach ($entry['changes'] as $change) {
                            if ($change['field'] === 'messages' && isset($change['value']['messages'])) {
                                $message = $this->messageService->processIncomingMessage($change);
                            }
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::error('Error processing webhook: ' . $e->getMessage());
        }

        return response()->json(['status' => 'EVENT_RECEIVED'], 200);
    }
}
