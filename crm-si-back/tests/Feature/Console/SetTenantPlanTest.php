<?php

namespace Tests\Feature\Console;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SetTenantPlanTest extends TestCase
{
    use RefreshDatabase;

    public function test_converts_tenant_to_pro_and_clears_trial(): void
    {
        $tenant = Tenant::create(['name' => 'Acme', 'trial_ends_at' => now()->addDays(3)]);

        $this->artisan('tenant:set-plan', ['tenant' => $tenant->id, 'plan' => 'pro'])
            ->assertSuccessful();

        $tenant->refresh();
        $this->assertEquals('pro', $tenant->planKey());
        $this->assertNull($tenant->trial_ends_at);
    }

    public function test_extends_trial_with_trial_days_option(): void
    {
        $tenant = Tenant::create(['name' => 'Acme', 'trial_ends_at' => null]);

        $this->artisan('tenant:set-plan', [
            'tenant' => $tenant->id,
            'plan' => 'free',
            '--trial-days' => 30,
        ])->assertSuccessful();

        $tenant->refresh();
        $this->assertEquals('free', $tenant->planKey());
        $this->assertNotNull($tenant->trial_ends_at);
        $this->assertEqualsWithDelta(
            now()->addDays(30)->timestamp,
            $tenant->trial_ends_at->timestamp,
            5
        );
    }

    public function test_fails_with_invalid_plan_key(): void
    {
        $tenant = Tenant::create(['name' => 'Acme']);

        $this->artisan('tenant:set-plan', ['tenant' => $tenant->id, 'plan' => 'bogus'])
            ->assertFailed();
    }
}
