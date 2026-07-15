<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\WebhookDelivery;
use App\Models\WebhookEndpoint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class WebhookDeliveryPruneTest extends TestCase
{
    use RefreshDatabase;

    public function test_prune_removes_deliveries_older_than_retention(): void
    {
        config()->set('webhooks.delivery_retention_days', 30);

        $endpoint = $this->makeEndpoint();

        $old = WebhookDelivery::create([
            'tenant_id' => $endpoint->tenant_id,
            'webhook_endpoint_id' => $endpoint->id,
            'status' => 'processed',
            'http_status' => 200,
        ]);
        $old->forceFill(['created_at' => now()->subDays(40)])->save();

        $recent = WebhookDelivery::create([
            'tenant_id' => $endpoint->tenant_id,
            'webhook_endpoint_id' => $endpoint->id,
            'status' => 'processed',
            'http_status' => 200,
        ]);
        $recent->forceFill(['created_at' => now()->subDays(5)])->save();

        $this->artisan('model:prune', ['--model' => [WebhookDelivery::class]])
            ->assertExitCode(0);

        $this->assertDatabaseMissing('webhook_deliveries', ['id' => $old->id]);
        $this->assertDatabaseHas('webhook_deliveries', ['id' => $recent->id]);
    }

    private function makeEndpoint(): WebhookEndpoint
    {
        $tenant = Tenant::create(['name' => 'Acme '.uniqid()]);
        $endpoint = new WebhookEndpoint([
            'tenant_id' => $tenant->id,
            'name' => 'EP',
            'slug' => 'ep-'.Str::lower(Str::random(6)),
            'target' => 'contacts',
            'enabled' => true,
        ]);
        $endpoint->setApiKey(WebhookEndpoint::generateApiKey());
        $endpoint->save();

        return $endpoint;
    }
}
