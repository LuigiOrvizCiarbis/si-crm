<?php

namespace Tests\Feature;

use App\Enums\ContactFieldType;
use App\Models\Contact;
use App\Models\ContactField;
use App\Models\Tenant;
use App\Models\WebhookEndpoint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class IncomingWebhookTest extends TestCase
{
    use RefreshDatabase;

    public function test_missing_api_key_returns_401_without_delivery(): void
    {
        $endpoint = $this->makeEndpoint();

        $this->postJson('/api/incoming-webhooks/'.$endpoint->slug, [
            'contacts' => [['external_id' => 'u1', 'name' => 'A']],
        ])->assertStatus(401);

        $this->assertDatabaseCount('webhook_deliveries', 0);
    }

    public function test_invalid_api_key_returns_401(): void
    {
        $endpoint = $this->makeEndpoint();

        $this->withHeaders(['X-Api-Key' => 'whk_wrongkey'])
            ->postJson('/api/incoming-webhooks/'.$endpoint->slug, [
                'contacts' => [['external_id' => 'u1', 'name' => 'A']],
            ])->assertStatus(401);

        $this->assertDatabaseCount('webhook_deliveries', 0);
    }

    public function test_key_of_one_endpoint_cannot_be_used_on_another_slug(): void
    {
        [$plain] = $this->makeEndpointWithKey();
        $other = $this->makeEndpoint();

        // Key válida pero slug de otro endpoint → 401 uniforme.
        $this->withHeaders(['X-Api-Key' => $plain])
            ->postJson('/api/incoming-webhooks/'.$other->slug, [
                'contacts' => [['external_id' => 'u1', 'name' => 'A']],
            ])->assertStatus(401);
    }

    public function test_disabled_endpoint_returns_403(): void
    {
        [$plain, $endpoint] = $this->makeEndpointWithKey();
        $endpoint->update(['enabled' => false]);

        $this->withHeaders(['X-Api-Key' => $plain])
            ->postJson('/api/incoming-webhooks/'.$endpoint->slug, [
                'contacts' => [['external_id' => 'u1', 'name' => 'A']],
            ])->assertStatus(403);
    }

    public function test_signature_optional_when_no_secret(): void
    {
        [$plain, $endpoint] = $this->makeEndpointWithKey();

        $this->withHeaders(['X-Api-Key' => $plain])
            ->postJson('/api/incoming-webhooks/'.$endpoint->slug, [
                'contacts' => [['external_id' => 'u1', 'name' => 'A']],
            ])->assertOk();
    }

    public function test_signature_required_and_validated_when_secret_set(): void
    {
        $secret = 'super-secret';
        [$plain, $endpoint] = $this->makeEndpointWithKey();
        $endpoint->setEncryptedSigningSecret($secret);
        $endpoint->save();

        $payload = ['contacts' => [['external_id' => 'u1', 'name' => 'A']]];

        // Sin firma → 401.
        $this->withHeaders(['X-Api-Key' => $plain])
            ->postJson('/api/incoming-webhooks/'.$endpoint->slug, $payload)
            ->assertStatus(401);

        // Firma incorrecta → 401.
        $this->withHeaders([
            'X-Api-Key' => $plain,
            'X-Signature-256' => 'sha256=deadbeef',
        ])->postJson('/api/incoming-webhooks/'.$endpoint->slug, $payload)
            ->assertStatus(401);

        // Firma válida sobre el raw body → 200.
        $signature = 'sha256='.hash_hmac('sha256', json_encode($payload), $secret);
        $this->withHeaders([
            'X-Api-Key' => $plain,
            'X-Signature-256' => $signature,
        ])->postJson('/api/incoming-webhooks/'.$endpoint->slug, $payload)
            ->assertOk();
    }

    public function test_invalid_payload_returns_422_and_records_rejected_delivery(): void
    {
        [$plain, $endpoint] = $this->makeEndpointWithKey();

        // Falta name en el item.
        $this->withHeaders(['X-Api-Key' => $plain])
            ->postJson('/api/incoming-webhooks/'.$endpoint->slug, [
                'contacts' => [['external_id' => 'u1']],
            ])->assertStatus(422);

        $this->assertDatabaseHas('webhook_deliveries', [
            'webhook_endpoint_id' => $endpoint->id,
            'status' => 'rejected',
            'http_status' => 422,
        ]);
    }

    public function test_upsert_creates_contact_with_tenant_without_auth_and_second_post_updates(): void
    {
        [$plain, $endpoint] = $this->makeEndpointWithKey();

        $this->withHeaders(['X-Api-Key' => $plain])
            ->postJson('/api/incoming-webhooks/'.$endpoint->slug, [
                'contacts' => [['external_id' => 'u1', 'name' => 'Alice', 'email' => 'a@x.com']],
            ])->assertOk()
            ->assertJsonPath('created', 1)
            ->assertJsonPath('updated', 0);

        $this->assertDatabaseHas('contacts', [
            'tenant_id' => $endpoint->tenant_id,
            'source' => 'webhook',
            'external_id' => 'u1',
            'name' => 'Alice',
            'email' => 'a@x.com',
        ]);

        // Segundo POST con el mismo external_id → actualiza, no duplica.
        $this->withHeaders(['X-Api-Key' => $plain])
            ->postJson('/api/incoming-webhooks/'.$endpoint->slug, [
                'contacts' => [['external_id' => 'u1', 'name' => 'Alice Renamed']],
            ])->assertOk()
            ->assertJsonPath('created', 0)
            ->assertJsonPath('updated', 1);

        $this->assertDatabaseCount('contacts', 1);
        $this->assertDatabaseHas('contacts', [
            'external_id' => 'u1',
            'name' => 'Alice Renamed',
        ]);
    }

    public function test_partial_batch_does_not_abort_on_invalid_item(): void
    {
        [$plain, $endpoint] = $this->makeEndpointWithKey();
        ContactField::create([
            'tenant_id' => $endpoint->tenant_id,
            'key' => 'age',
            'label' => 'Age',
            'type' => ContactFieldType::Number,
        ]);

        $response = $this->withHeaders(['X-Api-Key' => $plain])
            ->postJson('/api/incoming-webhooks/'.$endpoint->slug, [
                'contacts' => [
                    ['external_id' => 'ok', 'name' => 'Valid'],
                    ['external_id' => 'bad', 'name' => 'Invalid', 'custom_data' => ['age' => 'not-a-number']],
                    ['external_id' => 'unknown', 'name' => 'UnknownKey', 'custom_data' => ['nope' => 'x']],
                ],
            ])->assertOk();

        $response->assertJsonPath('created', 1)
            ->assertJsonPath('failed', 2);

        $this->assertDatabaseHas('contacts', ['external_id' => 'ok']);
        $this->assertDatabaseMissing('contacts', ['external_id' => 'bad']);
        $this->assertDatabaseMissing('contacts', ['external_id' => 'unknown']);
    }

    public function test_custom_data_valid_and_merges_on_update(): void
    {
        [$plain, $endpoint] = $this->makeEndpointWithKey();
        foreach (['color', 'size'] as $key) {
            ContactField::create([
                'tenant_id' => $endpoint->tenant_id,
                'key' => $key,
                'label' => ucfirst($key),
                'type' => ContactFieldType::Text,
            ]);
        }

        $this->withHeaders(['X-Api-Key' => $plain])
            ->postJson('/api/incoming-webhooks/'.$endpoint->slug, [
                'contacts' => [['external_id' => 'u1', 'name' => 'A', 'custom_data' => ['color' => 'red', 'size' => 'M']]],
            ])->assertOk();

        // Update con solo una key: no debe pisar la otra (merge).
        $this->withHeaders(['X-Api-Key' => $plain])
            ->postJson('/api/incoming-webhooks/'.$endpoint->slug, [
                'contacts' => [['external_id' => 'u1', 'name' => 'A', 'custom_data' => ['color' => 'blue']]],
            ])->assertOk();

        $contact = Contact::withoutGlobalScopes()->where('external_id', 'u1')->first();
        $this->assertSame('blue', $contact->custom_data['color']);
        $this->assertSame('M', $contact->custom_data['size']);
    }

    public function test_key_of_tenant_a_never_writes_into_tenant_b(): void
    {
        [$plainA, $endpointA] = $this->makeEndpointWithKey();
        $tenantB = Tenant::create(['name' => 'B '.uniqid()]);

        $this->withHeaders(['X-Api-Key' => $plainA])
            ->postJson('/api/incoming-webhooks/'.$endpointA->slug, [
                'contacts' => [['external_id' => 'u1', 'name' => 'A']],
            ])->assertOk();

        $this->assertDatabaseHas('contacts', ['tenant_id' => $endpointA->tenant_id, 'external_id' => 'u1']);
        $this->assertDatabaseMissing('contacts', ['tenant_id' => $tenantB->id]);
    }

    public function test_throttle_returns_429_after_limit(): void
    {
        $this->makeEndpoint();

        // El throttle corre antes del controller y agrupa por X-Api-Key. Con una
        // key inválida constante, los primeros 60 dan 401 y el 61 da 429.
        for ($i = 0; $i < 60; $i++) {
            $this->withHeaders(['X-Api-Key' => 'whk_constant_invalid'])
                ->postJson('/api/incoming-webhooks/whatever', ['contacts' => []])
                ->assertStatus(401);
        }

        $this->withHeaders(['X-Api-Key' => 'whk_constant_invalid'])
            ->postJson('/api/incoming-webhooks/whatever', ['contacts' => []])
            ->assertStatus(429);
    }

    private function makeEndpoint(): WebhookEndpoint
    {
        return $this->makeEndpointWithKey()[1];
    }

    /**
     * @return array{0: string, 1: WebhookEndpoint}
     */
    private function makeEndpointWithKey(?Tenant $tenant = null): array
    {
        $tenant ??= Tenant::create(['name' => 'Acme '.uniqid()]);
        $plain = WebhookEndpoint::generateApiKey();

        $endpoint = new WebhookEndpoint([
            'tenant_id' => $tenant->id,
            'name' => 'Test endpoint',
            'slug' => 'test-'.Str::lower(Str::random(6)),
            'target' => 'contacts',
            'enabled' => true,
        ]);
        $endpoint->setApiKey($plain);
        $endpoint->save();

        return [$plain, $endpoint];
    }
}
