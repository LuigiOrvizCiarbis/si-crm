<?php

namespace Tests\Feature\Api;

use App\Models\Invitation;
use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use App\Support\PermissionCatalog;
use App\Support\RoleProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class TrialTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_without_invitation_assigns_trial(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Nuevo Usuario',
            'email' => 'nuevo@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);

        $tenant = Tenant::first();
        $this->assertNotNull($tenant->trial_ends_at);
        $this->assertEqualsWithDelta(
            now()->addDays(14)->timestamp,
            $tenant->trial_ends_at->timestamp,
            5
        );
        $this->assertEquals('free', $tenant->planKey());
    }

    public function test_register_with_invitation_does_not_touch_existing_tenant_trial(): void
    {
        [$tenant, $owner] = $this->createTenantAndUser();
        $tenant->update(['trial_ends_at' => null]);

        $invitation = Invitation::create([
            'tenant_id' => $tenant->id,
            'email' => 'invitado@example.com',
            'role_name' => 'Admin',
            'token' => str_repeat('a', 64),
            'expires_at' => now()->addDays(7),
            'invited_by' => $owner->id,
        ]);

        $response = $this->postJson('/api/register', [
            'name' => 'Invitado',
            'email' => 'invitado@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'invitation_token' => $invitation->token,
        ]);

        $response->assertStatus(201);
        $this->assertNull($tenant->fresh()->trial_ends_at);
    }

    public function test_tenant_create_without_plan_id_defaults_to_free(): void
    {
        $tenant = Tenant::create(['name' => 'Sin plan explícito']);

        $this->assertEquals('free', $tenant->planKey());
    }

    public function test_expired_trial_blocks_protected_endpoint(): void
    {
        [$tenant, $user] = $this->createTenantAndUser();
        $tenant->update(['trial_ends_at' => now()->subDay()]);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/tags');

        $response->assertStatus(402);
        $response->assertJsonPath('error', 'trial_expired');
    }

    public function test_expired_trial_allows_user_endpoint_and_logout(): void
    {
        [$tenant, $user] = $this->createTenantAndUser();
        $tenant->update(['trial_ends_at' => now()->subDay()]);
        Sanctum::actingAs($user);

        $userResponse = $this->getJson('/api/user');
        $userResponse->assertStatus(200);
        $userResponse->assertJsonPath('user.tenant.plan.key', 'free');
        $userResponse->assertJsonPath('user.tenant.trial_ends_at', fn ($value) => $value !== null);

        $logoutResponse = $this->postJson('/api/logout');
        $logoutResponse->assertStatus(200);
    }

    public function test_active_trial_allows_access(): void
    {
        [$tenant, $user] = $this->createTenantAndUser();
        $tenant->update(['trial_ends_at' => now()->addDays(5)]);
        Sanctum::actingAs($user);

        $this->getJson('/api/tags')->assertStatus(200);
    }

    public function test_null_trial_ends_at_allows_access(): void
    {
        [$tenant, $user] = $this->createTenantAndUser();
        $tenant->update(['trial_ends_at' => null]);
        Sanctum::actingAs($user);

        $this->getJson('/api/tags')->assertStatus(200);
    }

    public function test_pro_plan_ignores_expired_trial_date(): void
    {
        [$tenant, $user] = $this->createTenantAndUser();
        $proPlan = Plan::where('key', 'pro')->firstOrFail();
        $tenant->update(['plan_id' => $proPlan->id, 'trial_ends_at' => now()->subDay()]);
        Sanctum::actingAs($user);

        $this->getJson('/api/tags')->assertStatus(200);
    }

    /**
     * @return array{0: Tenant, 1: User}
     */
    private function createTenantAndUser(): array
    {
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId(null);
        foreach (PermissionCatalog::all() as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
        $registrar->forgetCachedPermissions();

        $tenant = Tenant::create(['name' => 'Acme '.uniqid()]);
        app(RoleProvisioner::class)->provisionDefaultRoles($tenant);
        $registrar->setPermissionsTeamId($tenant->id);

        $user = User::factory()->create(['tenant_id' => $tenant->id]);
        $user->assignRole('Owner');

        return [$tenant, $user];
    }
}
