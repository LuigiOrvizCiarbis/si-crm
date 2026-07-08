<?php

namespace Tests\Feature;

use App\Enums\AiProvider;
use App\Enums\UserRole;
use App\Models\AiConfig;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Ai\AiProviderFactory;
use App\Services\Ai\Providers\AnthropicProvider;
use App\Services\Ai\Providers\OpenAiProvider;
use App\Support\PermissionCatalog;
use App\Support\RoleProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class AiConfigTest extends TestCase
{
    use RefreshDatabase;

    private const SYSTEM_PROMPT_MAX_LENGTH = 20000;

    public function test_api_key_round_trip_encryption(): void
    {
        $tenant = $this->makeTenant();

        $config = AiConfig::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'provider' => AiProvider::CLAUDE,
            'enabled' => true,
        ]);
        $config->setEncryptedApiKey('sk-secret-123');

        // Persistida encriptada (no en claro) y recuperable.
        $this->assertNotSame('sk-secret-123', $config->fresh()->api_key);
        $this->assertSame('sk-secret-123', $config->fresh()->getDecryptedApiKey());
    }

    public function test_api_key_is_hidden_in_serialization(): void
    {
        $tenant = $this->makeTenant();
        $config = AiConfig::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'provider' => AiProvider::OPENAI,
            'enabled' => true,
        ]);
        $config->setEncryptedApiKey('sk-secret');

        $this->assertArrayNotHasKey('api_key', $config->fresh()->toArray());
    }

    public function test_factory_returns_driver_by_provider(): void
    {
        $tenant = $this->makeTenant();

        $claude = AiConfig::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'provider' => AiProvider::CLAUDE,
            'enabled' => true,
        ]);
        $claude->setEncryptedApiKey('sk-claude');

        $this->assertInstanceOf(AnthropicProvider::class, AiProviderFactory::make($claude->fresh()));

        $claude->update(['provider' => AiProvider::OPENAI]);
        $this->assertInstanceOf(OpenAiProvider::class, AiProviderFactory::make($claude->fresh()));
    }

    public function test_factory_returns_null_without_api_key(): void
    {
        $tenant = $this->makeTenant();
        $config = AiConfig::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'provider' => AiProvider::CLAUDE,
            'enabled' => true,
        ]);

        $this->assertNull(AiProviderFactory::make($config));
    }

    public function test_show_endpoint_never_exposes_api_key(): void
    {
        [$user, $tenant] = $this->makeAdmin();
        $config = AiConfig::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'provider' => AiProvider::CLAUDE,
            'model' => 'claude-opus-4-8',
            'enabled' => true,
        ]);
        $config->setEncryptedApiKey('sk-secret');

        Sanctum::actingAs($user);

        $this->getJson('/api/ai-config')
            ->assertOk()
            ->assertJsonPath('data.provider', 'claude')
            ->assertJsonPath('data.has_api_key', true)
            ->assertJsonMissingPath('data.api_key');
    }

    public function test_update_creates_config_and_encrypts_key(): void
    {
        [$user, $tenant] = $this->makeAdmin();
        Sanctum::actingAs($user);

        $this->putJson('/api/ai-config', [
            'provider' => 'openai',
            'model' => 'gpt-4o',
            'enabled' => true,
            'system_prompt' => 'Sé breve.',
            'api_key' => 'sk-new-key',
        ])
            ->assertOk()
            ->assertJsonPath('data.provider', 'openai')
            ->assertJsonPath('data.has_api_key', true)
            ->assertJsonMissingPath('data.api_key');

        $config = AiConfig::withoutGlobalScopes()->where('tenant_id', $tenant->id)->firstOrFail();
        $this->assertSame('sk-new-key', $config->getDecryptedApiKey());
    }

    public function test_update_accepts_system_prompt_longer_than_5000_characters(): void
    {
        [$user, $tenant] = $this->makeAdmin();
        Sanctum::actingAs($user);

        $prompt = str_repeat('a', 5001);

        $this->putJson('/api/ai-config', [
            'provider' => 'claude',
            'enabled' => true,
            'system_prompt' => $prompt,
        ])
            ->assertOk()
            ->assertJsonPath('data.system_prompt', $prompt);

        $config = AiConfig::withoutGlobalScopes()->where('tenant_id', $tenant->id)->firstOrFail();
        $this->assertSame($prompt, $config->system_prompt);
    }

    public function test_update_rejects_system_prompt_over_max_length(): void
    {
        [$user] = $this->makeAdmin();
        Sanctum::actingAs($user);

        $this->putJson('/api/ai-config', [
            'provider' => 'claude',
            'enabled' => true,
            'system_prompt' => str_repeat('a', self::SYSTEM_PROMPT_MAX_LENGTH + 1),
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('system_prompt');
    }

    public function test_connection_test_rejects_system_prompt_over_max_length(): void
    {
        [$user] = $this->makeAdmin();
        Sanctum::actingAs($user);

        $this->postJson('/api/ai-config/test', [
            'provider' => 'claude',
            'system_prompt' => str_repeat('a', self::SYSTEM_PROMPT_MAX_LENGTH + 1),
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('system_prompt');
    }

    public function test_update_without_api_key_keeps_existing(): void
    {
        [$user, $tenant] = $this->makeAdmin();
        $config = AiConfig::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'provider' => AiProvider::CLAUDE,
            'enabled' => true,
        ]);
        $config->setEncryptedApiKey('sk-original');

        Sanctum::actingAs($user);

        $this->putJson('/api/ai-config', [
            'provider' => 'claude',
            'enabled' => false,
        ])->assertOk();

        $fresh = $config->fresh();
        $this->assertSame('sk-original', $fresh->getDecryptedApiKey());
        $this->assertFalse($fresh->enabled);
    }

    public function test_update_rejects_invalid_provider(): void
    {
        [$user] = $this->makeAdmin();
        Sanctum::actingAs($user);

        $this->putJson('/api/ai-config', [
            'provider' => 'gemini',
            'enabled' => true,
        ])->assertStatus(422);
    }

    public function test_non_admin_cannot_manage_ai_config(): void
    {
        [, $tenant] = $this->makeAdmin();

        // Usuario del mismo tenant SIN rol admin/owner.
        $member = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => UserRole::EMPLOYEE,
        ]);

        Sanctum::actingAs($member);

        $this->putJson('/api/ai-config', [
            'provider' => 'claude',
            'enabled' => true,
        ])->assertStatus(403);
    }

    public function test_models_endpoint_returns_sorted_ids_for_claude(): void
    {
        Http::fake([
            'api.anthropic.com/v1/models*' => Http::response([
                'data' => [
                    ['id' => 'claude-opus-4-8'],
                    ['id' => 'claude-haiku-4-5'],
                ],
            ]),
        ]);

        [$user, $tenant] = $this->makeAdmin();
        $config = AiConfig::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'provider' => AiProvider::CLAUDE,
            'enabled' => true,
        ]);
        $config->setEncryptedApiKey('sk-claude');

        Sanctum::actingAs($user);

        $this->getJson('/api/ai-config/models')
            ->assertOk()
            ->assertExactJson(['data' => ['claude-haiku-4-5', 'claude-opus-4-8']]);
    }

    public function test_models_endpoint_filters_non_chat_openai_models(): void
    {
        Http::fake([
            'api.openai.com/v1/models*' => Http::response([
                'data' => [
                    ['id' => 'gpt-4o'],
                    ['id' => 'text-embedding-3-small'],
                    ['id' => 'whisper-1'],
                    ['id' => 'o1-mini'],
                    ['id' => 'dall-e-3'],
                ],
            ]),
        ]);

        [$user, $tenant] = $this->makeAdmin();
        $config = AiConfig::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'provider' => AiProvider::OPENAI,
            'enabled' => true,
        ]);
        $config->setEncryptedApiKey('sk-openai');

        Sanctum::actingAs($user);

        $this->getJson('/api/ai-config/models')
            ->assertOk()
            ->assertExactJson(['data' => ['gpt-4o', 'o1-mini']]);
    }

    public function test_models_endpoint_returns_empty_without_api_key(): void
    {
        Http::fake();

        [$user, $tenant] = $this->makeAdmin();
        AiConfig::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'provider' => AiProvider::CLAUDE,
            'enabled' => true,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/ai-config/models')
            ->assertOk()
            ->assertExactJson(['data' => []]);

        // Sin key no debe salir ninguna llamada al proveedor.
        Http::assertNothingSent();
    }

    /**
     * @return array<string, array{0: AiProvider, 1: string, 2: bool}>
     */
    public static function visionModelProvider(): array
    {
        return [
            // provider, model, esperaSoporteDeVision
            'claude opus 4.8' => [AiProvider::CLAUDE, 'claude-opus-4-8', true],
            'claude haiku 4.5' => [AiProvider::CLAUDE, 'claude-haiku-4-5', true],
            'claude 3 sonnet' => [AiProvider::CLAUDE, 'claude-3-sonnet-20240229', true],
            'claude 2 (sin vision)' => [AiProvider::CLAUDE, 'claude-2.1', false],
            'claude instant (sin vision)' => [AiProvider::CLAUDE, 'claude-instant-1.2', false],
            'gpt-4o' => [AiProvider::OPENAI, 'gpt-4o', true],
            'gpt-4o datado' => [AiProvider::OPENAI, 'gpt-4o-2024-08-06', true],
            'gpt-4.1' => [AiProvider::OPENAI, 'gpt-4.1', true],
            'gpt-4-turbo (con vision)' => [AiProvider::OPENAI, 'gpt-4-turbo', true],
            'gpt-4 base (sin vision)' => [AiProvider::OPENAI, 'gpt-4', false],
            'gpt-4 datado base (sin vision)' => [AiProvider::OPENAI, 'gpt-4-0613', false],
            'gpt-3.5 (sin vision)' => [AiProvider::OPENAI, 'gpt-3.5-turbo', false],
            'o1-mini (sin vision)' => [AiProvider::OPENAI, 'o1-mini', false],
            'modelo desconocido asume vision' => [AiProvider::OPENAI, 'gpt-9-ultra', true],
        ];
    }

    #[DataProvider('visionModelProvider')]
    public function test_model_supports_vision_heuristic(AiProvider $provider, string $model, bool $expected): void
    {
        $this->assertSame($expected, $provider->modelSupportsVision($model));
    }

    public function test_update_returns_vision_warning_for_text_only_model(): void
    {
        [$user] = $this->makeAdmin();
        Sanctum::actingAs($user);

        $this->putJson('/api/ai-config', [
            'provider' => 'openai',
            'model' => 'gpt-3.5-turbo',
            'enabled' => true,
        ])
            ->assertOk()
            ->assertJsonPath('data.model', 'gpt-3.5-turbo')
            ->assertJsonFragment(['model_vision_warning' => $this->expectedWarning('gpt-3.5-turbo')]);
    }

    public function test_connection_test_without_system_prompt_or_model_does_not_500(): void
    {
        // Regresión: model y system_prompt son nullable; si el request no los
        // trae, el controller no debe reventar con "Undefined array key".
        Http::fake([
            'api.openai.com/*' => Http::response(['error' => ['message' => 'bad key']], 401),
        ]);

        [$user, $tenant] = $this->makeAdmin();
        $config = AiConfig::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'provider' => AiProvider::OPENAI,
            'enabled' => true,
        ]);
        $config->setEncryptedApiKey('sk-existing');

        Sanctum::actingAs($user);

        $this->postJson('/api/ai-config/test', ['provider' => 'openai'])
            ->assertOk()
            ->assertJsonPath('data.ok', false);
    }

    public function test_connection_test_returns_vision_warning_for_text_only_model(): void
    {
        Http::fake([
            'api.openai.com/*' => Http::response(['error' => ['message' => 'bad key']], 401),
        ]);

        [$user] = $this->makeAdmin();
        Sanctum::actingAs($user);

        $this->postJson('/api/ai-config/test', [
            'provider' => 'openai',
            'model' => 'gpt-3.5-turbo',
            'api_key' => 'sk-fake',
        ])
            ->assertOk()
            ->assertJsonPath('data.model_vision_warning', $this->expectedWarning('gpt-3.5-turbo'))
            ->assertJsonPath('data.ok', false);
    }

    public function test_update_returns_null_vision_warning_for_multimodal_model(): void
    {
        [$user] = $this->makeAdmin();
        Sanctum::actingAs($user);

        $this->putJson('/api/ai-config', [
            'provider' => 'openai',
            'model' => 'gpt-4o',
            'enabled' => true,
        ])
            ->assertOk()
            ->assertJsonPath('model_vision_warning', null);
    }

    private function expectedWarning(string $model): string
    {
        return "El modelo {$model} no procesa imágenes: las fotos que "
            .'envíen los clientes por WhatsApp serán ignoradas por el asistente. '
            .'Elegí un modelo con soporte de visión (por ejemplo gpt-4o o claude-opus-4-8) '
            .'si querés que el bot pueda verlas.';
    }

    private function makeTenant(): Tenant
    {
        return Tenant::create(['name' => 'Acme '.uniqid()]);
    }

    /**
     * @return array{0: User, 1: Tenant}
     */
    private function makeAdmin(): array
    {
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId(null);
        foreach (PermissionCatalog::all() as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
        $registrar->forgetCachedPermissions();

        $tenant = $this->makeTenant();
        app(RoleProvisioner::class)->provisionDefaultRoles($tenant);
        $registrar->setPermissionsTeamId($tenant->id);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => UserRole::ADMIN,
        ]);
        $user->assignRole('Owner');

        return [$user, $tenant];
    }
}
