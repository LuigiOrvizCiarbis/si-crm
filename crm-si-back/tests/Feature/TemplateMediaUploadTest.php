<?php

namespace Tests\Feature;

use App\Enums\ChannelType;
use App\Enums\UserRole;
use App\Models\Channel;
use App\Models\Tenant;
use App\Models\User;
use App\Models\WhatsAppConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TemplateMediaUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_uploads_pdf_to_meta_and_returns_media_id(): void
    {
        Http::fake([
            'graph.facebook.com/*' => Http::response(['id' => 'MEDIA_ID_123']),
        ]);

        [$user, $channel] = $this->createChannel();

        Sanctum::actingAs($user);

        $this->postJson("/api/channels/{$channel->id}/media", [
            'file' => UploadedFile::fake()->createWithContent('comprobante.pdf', '%PDF-1.4 test'),
        ])
            ->assertCreated()
            ->assertJson(['media_id' => 'MEDIA_ID_123']);
    }

    public function test_rejects_unsupported_mime_type(): void
    {
        Http::fake();

        [$user, $channel] = $this->createChannel();

        Sanctum::actingAs($user);

        $this->postJson("/api/channels/{$channel->id}/media", [
            'file' => UploadedFile::fake()->create('script.sh', 10, 'text/x-shellscript'),
        ])->assertStatus(422);

        Http::assertNothingSent();
    }

    public function test_channel_without_whatsapp_config_returns_404(): void
    {
        [$user, $channel] = $this->createChannel(withConfig: false);

        Sanctum::actingAs($user);

        $this->postJson("/api/channels/{$channel->id}/media", [
            'file' => UploadedFile::fake()->create('doc.pdf', 10, 'application/pdf'),
        ])->assertNotFound();
    }

    /**
     * @return array{0: User, 1: Channel}
     */
    private function createChannel(bool $withConfig = true): array
    {
        $tenant = Tenant::create(['name' => 'Acme '.uniqid()]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => UserRole::ADMIN,
        ]);

        $configId = null;
        if ($withConfig) {
            $configId = WhatsAppConfig::create([
                'phone_number_id' => '123456789',
                'display_phone_number' => '+54 9 223 511-2208',
                'waba_id' => 'waba-test',
                'bussines_token' => Crypt::encryptString('test-token'),
            ])->id;
        }

        $channel = Channel::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'type' => ChannelType::WHATSAPP,
            'name' => 'Main channel',
            'status' => 'active',
            'whatsapp_config_id' => $configId,
        ]);

        return [$user, $channel];
    }
}
