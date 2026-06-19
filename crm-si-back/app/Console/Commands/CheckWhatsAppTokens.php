<?php

namespace App\Console\Commands;

use App\Models\WhatsAppConfig;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CheckWhatsAppTokens extends Command
{
    /**
     * @var string
     */
    protected $signature = 'whatsapp:check-tokens
                            {--dry-run : Simular sin guardar ni extender}
                            {--days=7 : Umbral de días para alertar por vencimiento próximo}';

    /**
     * @var string
     */
    protected $description = 'Revisa los tokens de WhatsApp: extiende los vigentes a permanentes y alerta de los vencidos/por vencer';

    private const GRAPH_VERSION = 'v21.0';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $days = (int) $this->option('days');

        if ($dryRun) {
            $this->warn('🔍 Modo DRY RUN — no se guardan ni extienden tokens');
        }

        $appId = config('services.facebook.app_id');
        $appSecret = config('services.facebook.app_secret');

        if (! $appId || ! $appSecret) {
            $this->error('Faltan credenciales de Facebook (app_id / app_secret).');

            return self::FAILURE;
        }

        $appToken = $appId.'|'.$appSecret;

        $configs = WhatsAppConfig::orderBy('id')->get();
        $this->info("Revisando {$configs->count()} configuraciones de WhatsApp...");

        $extended = 0;
        $alreadyPermanent = 0;
        $expired = 0;
        $expiringSoon = 0;
        $failed = 0;

        foreach ($configs as $config) {
            $label = "cfg #{$config->id} ({$config->display_phone_number})";

            $token = $config->getDecryptedToken();
            if (! $token) {
                $this->warn("{$label}: sin token o no se pudo desencriptar");
                $failed++;

                continue;
            }

            $info = $this->debugToken($appToken, $token);

            // Token inválido o vencido: no se puede extender, requiere re-onboarding.
            if (! ($info['is_valid'] ?? false)) {
                $expired++;
                Log::error('WhatsApp token vencido o inválido — requiere re-onboarding', [
                    'whatsapp_config_id' => $config->id,
                    'phone_number_id' => $config->phone_number_id,
                    'display_phone_number' => $config->display_phone_number,
                    'meta_error' => $info['error']['message'] ?? null,
                ]);
                $this->error("{$label}: VENCIDO/INVÁLIDO → requiere re-onboarding");

                continue;
            }

            $expiresAt = $info['expires_at'] ?? null;

            // expires_at = 0 → token permanente, nada que hacer.
            if ($expiresAt === 0) {
                $alreadyPermanent++;
                $this->line("{$label}: permanente ✓");

                continue;
            }

            // Token vigente con vencimiento: intentamos extenderlo a permanente.
            $remainingDays = $expiresAt ? (int) ceil(($expiresAt - time()) / 86400) : null;
            $this->line("{$label}: vence en {$remainingDays} días → extendiendo...");

            if ($remainingDays !== null && $remainingDays <= $days) {
                $expiringSoon++;
                Log::warning('WhatsApp token por vencer', [
                    'whatsapp_config_id' => $config->id,
                    'phone_number_id' => $config->phone_number_id,
                    'display_phone_number' => $config->display_phone_number,
                    'expires_at' => $expiresAt,
                    'remaining_days' => $remainingDays,
                ]);
            }

            if ($dryRun) {
                $this->comment('   (dry-run: no se extiende)');

                continue;
            }

            $newToken = $this->extendToken($appId, $appSecret, $token);
            if (! $newToken) {
                $failed++;
                Log::error('No se pudo extender el token de WhatsApp a permanente', [
                    'whatsapp_config_id' => $config->id,
                    'phone_number_id' => $config->phone_number_id,
                ]);
                $this->error("{$label}: falló la extensión");

                continue;
            }

            // Verificar que el nuevo token sea válido y permanente antes de guardarlo.
            $newInfo = $this->debugToken($appToken, $newToken);
            if (! ($newInfo['is_valid'] ?? false) || ($newInfo['expires_at'] ?? -1) !== 0) {
                $failed++;
                Log::error('Token extendido no es permanente, no se guarda', [
                    'whatsapp_config_id' => $config->id,
                    'new_expires_at' => $newInfo['expires_at'] ?? null,
                ]);
                $this->error("{$label}: el token extendido no es permanente, se descarta");

                continue;
            }

            $config->setEncryptedToken($newToken);
            $extended++;
            $this->info("{$label}: extendido a PERMANENTE ✓");
        }

        $this->newLine();
        $this->info(sprintf(
            'Resumen: extendidos=%d permanentes=%d vencidos=%d porVencer=%d fallos=%d',
            $extended,
            $alreadyPermanent,
            $expired,
            $expiringSoon,
            $failed
        ));

        return self::SUCCESS;
    }

    /**
     * Consulta el estado de un token vía debug_token.
     *
     * @return array<string, mixed>
     */
    private function debugToken(string $appToken, string $token): array
    {
        $response = Http::get('https://graph.facebook.com/'.self::GRAPH_VERSION.'/debug_token', [
            'input_token' => $token,
            'access_token' => $appToken,
        ]);

        return $response->json('data') ?? [];
    }

    /**
     * Extiende un token de larga duración a permanente vía fb_exchange_token.
     */
    private function extendToken(string $appId, string $appSecret, string $token): ?string
    {
        $response = Http::get('https://graph.facebook.com/'.self::GRAPH_VERSION.'/oauth/access_token', [
            'grant_type' => 'fb_exchange_token',
            'client_id' => $appId,
            'client_secret' => $appSecret,
            'fb_exchange_token' => $token,
        ]);

        if ($response->successful() && $response->json('access_token')) {
            return $response->json('access_token');
        }

        return null;
    }
}
