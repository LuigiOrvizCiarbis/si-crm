<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Contact;
use App\Models\Message;

class FacebookDataDeletionController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        $signedRequest = $request->input('signed_request');

        if (! $signedRequest) {
            return response()->json(['error' => 'Missing signed_request'], 400);
        }

        $data = $this->parseSignedRequest($signedRequest);

        if (! $data) {
            return response()->json(['error' => 'Invalid signed_request'], 400);
        }

        $userId = $data['user_id'] ?? null;

        if (! $userId) {
            return response()->json(['error' => 'Missing user_id'], 400);
        }

        $confirmationCode = $this->processDataDeletion($userId);

        $statusUrl = config('app.frontend_url', 'https://socialimpulse.com').'/data-deletion?code='.$confirmationCode;

        return response()->json([
            'url' => $statusUrl,
            'confirmation_code' => $confirmationCode,
        ]);
    }

    /**
     * Parse and verify the signed_request from Meta.
     *
     * @return array<string, mixed>|null
     */
    private function parseSignedRequest(string $signedRequest): ?array
    {
        $appSecret = config('services.facebook.app_secret');

        $parts = explode('.', $signedRequest, 2);

        if (count($parts) !== 2) {
            Log::warning('Facebook data deletion: malformed signed_request');

            return null;
        }

        [$encodedSig, $payload] = $parts;

        $sig = $this->base64UrlDecode($encodedSig);
        $data = json_decode($this->base64UrlDecode($payload), true);

        if (! $data) {
            Log::warning('Facebook data deletion: could not decode payload');

            return null;
        }

        $expectedSig = hash_hmac('sha256', $payload, $appSecret, true);

        if (! hash_equals($expectedSig, $sig)) {
            Log::warning('Facebook data deletion: signature verification failed');

            return null;
        }

        return $data;
    }

    private function base64UrlDecode(string $input): string
    {
        return base64_decode(strtr($input, '-_', '+/'));
    }

    /**
     * Process the data deletion for a Facebook user and return a confirmation code.
     */
    private function processDataDeletion(string $facebookUserId): string
    {
        $confirmationCode = 'del_'.bin2hex(random_bytes(16));

        Log::info('Facebook data deletion request', [
            'facebook_user_id' => $facebookUserId,
            'confirmation_code' => $confirmationCode,
        ]);

        // Delete messages from this Facebook user
        Message::where('external_id', 'LIKE', "%{$facebookUserId}%")->delete();

        // Delete contacts linked to this Facebook user
        Contact::where('external_id', $facebookUserId)->delete();

        Log::info('Facebook data deletion completed', [
            'facebook_user_id' => $facebookUserId,
            'confirmation_code' => $confirmationCode,
        ]);

        return $confirmationCode;
    }
}
