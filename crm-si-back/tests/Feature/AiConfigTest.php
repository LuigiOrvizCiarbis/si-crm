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
