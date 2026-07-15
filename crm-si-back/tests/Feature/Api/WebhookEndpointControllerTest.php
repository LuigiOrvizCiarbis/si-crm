<?php

namespace Tests\Feature\Api;

use App\Enums\ContactFieldType;
use App\Models\ContactField;
use App\Models\Tenant;
use App\Models\User;
use App\Models\WebhookEndpoint;
use App\Support\PermissionCatalog;
use App\Support\RoleProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class WebhookEndpointControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_endpoint_and_gets_plain_key_once(): void
    {
        [$user] = $this->createOwner();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/webhook-endpoints', ['name' => 'Billing']);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Billing')
            ->assertJsonPath('data.target', 'contacts')
            ->assertJsonPath('data.enabled', true);

        $plainKey = $response->json('data.api_key');
        $this->assertNotNull($plainKey);
        $this->assertStringStartsWith('whk_', $plainKey);

        // El index nunca devuelve la key en plano ni el hash.
        $index = $this->getJson('/api/webhook-endpoints');
        $index->assertOk();
        $this->assertArrayNotHasKey('api_key', $index->json('data.0'));
        $this->assertArrayNotHasKey('api_key_hash', $index->json('data.0'));
    }

    public function test_member_cannot_manage(): void
    {
        $tenant = $this->seedTenantWithRoles();
        $member = User::factory()->create(['tenant_id' => $tenant->id]);
        $member->assignRole('Member');
        Sanctum::actingAs($member);

        $this->postJson('/api/webhook-endpoints', ['name' => 'X'])->assertForbidden();
        $this->getJson('/api/webhook-endpoints')->assertForbidden();
        $this->getJson('/api/webhook-endpoints/schema')->assertForbidden();
    }

    public function test_schema_returns_real_contact_fields_for_current_tenant(): void
    {
        [$user, $tenant] = $this->createOwner();
        Sanctum::actingAs($user);

        ContactField::create([
            'tenant_id' => $tenant->id,
            'key' => 'plan',
            'label' => 'Plan',
            'type' => ContactFieldType::Select,
            'options' => ['choices' => ['Básico', 'Premium']],
            'is_required' => true,
            'display_order' => 1,
        ]);

        $otherTenant = Tenant::create(['name' => 'Other '.uniqid()]);
        ContactField::create([
            'tenant_id' => $otherTenant->id,
            'key' => 'private_field',
            'label' => 'Private',
            'type' => ContactFieldType::Text,
            'display_order' => 1,
        ]);

        $this->getJson('/api/webhook-endpoints/schema')
            ->assertOk()
            ->assertJsonPath('data.0.key', 'plan')
            ->assertJsonPath('data.0.type', 'select')
            ->assertJsonPath('data.0.options.choices.1', 'Premium')
            ->assertJsonPath('data.0.is_required', true)
            ->assertJsonMissing(['key' => 'private_field']);
    }

    public function test_rotate_key_invalidates_previous_key(): void
    {
        [$user, $tenant] = $this->createOwner();
        Sanctum::actingAs($user);

        $create = $this->postJson('/api/webhook-endpoints', ['name' => 'Rotatable']);
        $id = $create->json('data.id');
        $oldKey = $create->json('data.api_key');
        $slug = $create->json('data.slug');

        $rotate = $this->postJson("/api/webhook-endpoints/{$id}/rotate-key");
        $rotate->assertOk();
        $newKey = $rotate->json('data.api_key');

        $this->assertNotSame($oldKey, $newKey);

        // La key vieja ya no autentica en el endpoint público.
        $this->withHeaders(['X-Api-Key' => $oldKey])
            ->postJson("/api/incoming-webhooks/{$slug}", [
                'contacts' => [['external_id' => 'u1', 'name' => 'A']],
            ])->assertStatus(401);

        // La key nueva sí.
        $this->withHeaders(['X-Api-Key' => $newKey])
            ->postJson("/api/incoming-webhooks/{$slug}", [
                'contacts' => [['external_id' => 'u1', 'name' => 'A']],
            ])->assertOk();
    }

    public function test_update_can_toggle_enabled_and_remove_secret(): void
    {
        [$user, $tenant] = $this->createOwner();
        Sanctum::actingAs($user);

        $endpoint = $this->makeEndpoint($tenant, withSecret: true);

        $this->putJson("/api/webhook-endpoints/{$endpoint->id}", ['enabled' => false])
            ->assertOk()
            ->assertJsonPath('data.enabled', false);

        // signing_secret vacío = quitar.
        $this->putJson("/api/webhook-endpoints/{$endpoint->id}", ['signing_secret' => ''])
            ->assertOk()
            ->assertJsonPath('data.has_signing_secret', false);
    }

    public function test_tenant_isolation(): void
    {
        [$user] = $this->createOwner();
        Sanctum::actingAs($user);

        $otherTenant = Tenant::create(['name' => 'Other '.uniqid()]);
        $foreign = $this->makeEndpoint($otherTenant);

        // No aparece en el index del tenant actual.
        $this->getJson('/api/webhook-endpoints')
            ->assertOk()
            ->assertJsonMissing(['id' => $foreign->id]);

        // No se puede actualizar ni borrar el endpoint de otro tenant.
        $this->putJson("/api/webhook-endpoints/{$foreign->id}", ['enabled' => false])
            ->assertNotFound();
        $this->deleteJson("/api/webhook-endpoints/{$foreign->id}")
            ->assertNotFound();
    }

    public function test_deliveries_listing_and_detail(): void
    {
        [$user, $tenant] = $this->createOwner();
        Sanctum::actingAs($user);

        [$plain, $endpoint] = $this->makeEndpointWithKey($tenant);

        // Genera un delivery vía el endpoint público.
        $this->withHeaders(['X-Api-Key' => $plain])
            ->postJson("/api/incoming-webhooks/{$endpoint->slug}", [
                'contacts' => [['external_id' => 'u1', 'name' => 'A']],
            ])->assertOk();

        $list = $this->getJson("/api/webhook-endpoints/{$endpoint->id}/deliveries");
        $list->assertOk();
        $deliveryId = $list->json('data.0.id');
        $this->assertNotNull($deliveryId);
        // El listado no incluye el payload completo.
        $this->assertArrayNotHasKey('payload', $list->json('data.0'));

        $detail = $this->getJson("/api/webhook-endpoints/{$endpoint->id}/deliveries/{$deliveryId}");
        $detail->assertOk()
            ->assertJsonPath('data.status', 'processed');
        $this->assertArrayHasKey('payload', $detail->json('data'));
    }

    private function makeEndpoint(Tenant $tenant, bool $withSecret = false): WebhookEndpoint
    {
        return $this->makeEndpointWithKey($tenant, $withSecret)[1];
    }

    /**
     * @return array{0: string, 1: WebhookEndpoint}
     */
    private function makeEndpointWithKey(Tenant $tenant, bool $withSecret = false): array
    {
        $plain = WebhookEndpoint::generateApiKey();
        $endpoint = new WebhookEndpoint([
            'tenant_id' => $tenant->id,
            'name' => 'EP '.uniqid(),
            'slug' => 'ep-'.Str::lower(Str::random(6)),
            'target' => 'contacts',
            'enabled' => true,
        ]);
        $endpoint->setApiKey($plain);
        if ($withSecret) {
            $endpoint->setEncryptedSigningSecret('a-secret');
        }
        $endpoint->save();

        return [$plain, $endpoint];
    }

    /**
     * @return array{0: User, 1: Tenant}
     */
    private function createOwner(): array
    {
        $tenant = $this->seedTenantWithRoles();
        $user = User::factory()->create(['tenant_id' => $tenant->id]);
        $user->assignRole('Owner');

        return [$user, $tenant];
    }

    private function seedTenantWithRoles(): Tenant
    {
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId(null);
        foreach (PermissionCatalog::all() as $name) {
            Permission::findOrCreate($name, 'web');
        }
        $registrar->forgetCachedPermissions();

        $tenant = Tenant::create(['name' => 'Acme '.uniqid()]);
        app(RoleProvisioner::class)->provisionDefaultRoles($tenant);
        $registrar->setPermissionsTeamId($tenant->id);

        return $tenant;
    }
}
