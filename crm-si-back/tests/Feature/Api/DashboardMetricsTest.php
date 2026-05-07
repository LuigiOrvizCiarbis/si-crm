<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardMetricsTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/dashboard/metrics')->assertStatus(401);
    }

    public function test_authenticated_request_returns_expected_payload_shape(): void
    {
        $tenant = Tenant::create(['name' => 'Acme']);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => UserRole::ADMIN,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/dashboard/metrics');

        $response->assertOk()
            ->assertJsonStructure([
                'stages',
                'kpis' => [
                    'total_opportunities',
                    'pipeline_value',
                    'weighted_value',
                    'avg_value',
                    'total_conversations',
                    'total_contacts',
                    'won_count',
                    'won_value',
                    'global_conversion_rate',
                    'avg_roi',
                ],
                'previous',
                'trends',
                'daily_series',
                'omnichannel',
                'range' => ['start', 'end', 'periodo'],
            ]);
    }

    public function test_invalid_periodo_is_rejected(): void
    {
        $tenant = Tenant::create(['name' => 'Acme']);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'role' => UserRole::ADMIN,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/dashboard/metrics?periodo=invalido')
            ->assertStatus(422)
            ->assertJsonValidationErrors('periodo');
    }
}
