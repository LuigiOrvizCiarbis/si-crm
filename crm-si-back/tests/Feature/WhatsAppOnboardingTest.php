<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Channel;
use App\Models\Tenant;
use App\Models\User;
use App\Models\WhatsAppConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WhatsAppOnboardingTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/admin/channels/whatsapp-auth';

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.facebook.app_id', 'test-app-id');
        config()->set('services.facebook.app_secret', 'test-app-secret');
        config()->set('services.facebook.graph_version', 'v21.0');
    }

    public function test_user_can_connect_two_distinct_whatsapp_numbers_to_the_same_tenant(): void
    {
        [$tenant, $user] = $this->createTenantAndUser();
        Sanctum::actingAs($user);

        $this->fakeMetaWithRouter([
            'CODE_AAA' => ['waba' => 'WABA_AAA', 'phone' => 'PHONE_111', 'display' => '+54 11 1111-1111', 'token' => 'TOKEN_AAA'],
            'CODE_BBB' => ['waba' => 'WABA_BBB', 'phone' => 'PHONE_222', 'display' => '+54 11 2222-2222', 'token' => 'TOKEN_BBB'],
        ]);

        $first = $this->postJson(self::ENDPOINT, $this->payload('WABA_AAA', 'PHONE_111', 'CODE_AAA'));
        $first->assertOk()->assertJsonPath('success', true);

        $second = $this->postJson(self::ENDPOINT, $this->payload('WABA_BBB', 'PHONE_222', 'CODE_BBB'));
        $second->assertOk()->assertJsonPath('success', true);

        $this->assertSame(2, Channel::where('tenant_id', $tenant->id)->count());
        $this->assertSame(2, WhatsAppConfig::count());

        $configs = WhatsAppConfig::orderBy('id')->get();
        $this->assertSame('PHONE_111', $configs[0]->phone_number_id);
        $this->assertSame('PHONE_222', $configs[1]->phone_number_id);
        $this->assertSame('TOKEN_AAA', Crypt::decryptString($configs[0]->bussines_token));
        $this->assertSame('TOKEN_BBB', Crypt::decryptString($configs[1]->bussines_token));
    }

    public function test_reauthenticating_the_same_number_updates_the_token_without_creating_duplicates(): void
    {
        [$tenant, $user] = $this->createTenantAndUser();
        Sanctum::actingAs($user);

        $this->fakeMetaWithRouter([
            'CODE_FIRST' => ['waba' => 'WABA_AAA', 'phone' => 'PHONE_111', 'display' => '+54 11 1111-1111', 'token' => 'TOKEN_OLD'],
            'CODE_SECOND' => ['waba' => 'WABA_AAA', 'phone' => 'PHONE_111', 'display' => '+54 11 1111-1111', 'token' => 'TOKEN_NEW'],
        ]);

        $this->postJson(self::ENDPOINT, $this->payload('WABA_AAA', 'PHONE_111', 'CODE_FIRST'))->assertOk();
        $this->postJson(self::ENDPOINT, $this->payload('WABA_AAA', 'PHONE_111', 'CODE_SECOND'))->assertOk();

        $this->assertSame(1, Channel::where('tenant_id', $tenant->id)->count());
        $this->assertSame(1, WhatsAppConfig::count());

        $config = WhatsAppConfig::first();
        $this->assertSame('TOKEN_NEW', Crypt::decryptString($config->bussines_token));
    }

    public function test_another_user_in_the_tenant_cannot_take_over_a_number_already_connected(): void
    {
        [$tenant, $owner] = $this->createTenantAndUser();
        $otherUser = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => UserRole::EMPLOYEE,
        ]);

        $this->fakeMetaWithRouter([
            'CODE_OWNER' => ['waba' => 'WABA_AAA', 'phone' => 'PHONE_111', 'display' => '+54 11 1111-1111', 'token' => 'TOKEN_OWNER'],
            'CODE_OTHER' => ['waba' => 'WABA_AAA', 'phone' => 'PHONE_111', 'display' => '+54 11 1111-1111', 'token' => 'TOKEN_OTHER'],
        ]);

        Sanctum::actingAs($owner);
        $this->postJson(self::ENDPOINT, $this->payload('WABA_AAA', 'PHONE_111', 'CODE_OWNER'))->assertOk();

        Sanctum::actingAs($otherUser);
        $response = $this->postJson(self::ENDPOINT, $this->payload('WABA_AAA', 'PHONE_111', 'CODE_OTHER'));

        $response->assertStatus(409)->assertJsonPath('success', false);

        $this->assertSame(1, Channel::where('tenant_id', $tenant->id)->count());
        $this->assertSame($owner->id, Channel::first()->user_id);
        $this->assertSame('TOKEN_OWNER', Crypt::decryptString(WhatsAppConfig::first()->bussines_token));
    }

    /**
     * @return array{0: Tenant, 1: User}
     */
    private function createTenantAndUser(): array
    {
        $tenant = Tenant::create(['name' => 'Acme']);
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => UserRole::ADMIN,
        ]);

        return [$tenant, $user];
    }

    /**
     * @return array{code: string, name: string, data: array{waba_id: string, phone_number_id: string}}
     */
    private function payload(string $wabaId, string $phoneNumberId, string $code): array
    {
        return [
            'code' => $code,
            'name' => 'WhatsApp Business',
            'data' => [
                'waba_id' => $wabaId,
                'phone_number_id' => $phoneNumberId,
            ],
        ];
    }

    /**
     * Stubea Graph API ruteando por el `code` OAuth presente en cada request.
     * Una sola llamada a Http::fake() para que la respuesta dependa de la URL,
     * no del orden de registro (los handlers de Http::fake() no se reemplazan).
     *
     * @param  array<string, array{waba: string, phone: string, display: string, token: string}>  $byCode
     */
    private function fakeMetaWithRouter(array $byCode): void
    {
        Http::fake(function ($request) use ($byCode) {
            $url = (string) $request->url();

            if (str_contains($url, '/oauth/access_token')) {
                parse_str(parse_url($url, PHP_URL_QUERY) ?? '', $query);
                $code = $query['code'] ?? null;
                $entry = $byCode[$code] ?? null;
                if (! $entry) {
                    return Http::response(['error' => ['message' => "unmapped code {$code}"]], 400);
                }

                return Http::response([
                    'access_token' => $entry['token'],
                    'token_type' => 'bearer',
                ], 200);
            }

            foreach ($byCode as $entry) {
                if (str_contains($url, "/{$entry['waba']}/phone_numbers")) {
                    return Http::response([
                        'data' => [[
                            'id' => $entry['phone'],
                            'display_phone_number' => $entry['display'],
                            'verified_name' => 'Acme',
                        ]],
                    ], 200);
                }
                if (str_contains($url, "/{$entry['waba']}/subscribed_apps")
                    || str_contains($url, "/{$entry['phone']}/smb_app_data")) {
                    return Http::response(['success' => true], 200);
                }
            }

            return Http::response(['error' => ['message' => "unmapped url {$url}"]], 404);
        });
    }
}
