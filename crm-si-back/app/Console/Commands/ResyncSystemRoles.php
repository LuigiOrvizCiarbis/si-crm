<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Support\PermissionCatalog;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class ResyncSystemRoles extends Command
{
    protected $signature = 'roles:resync-system
                            {--apply : Persist changes. Without this flag the command runs as a dry run}';

    protected $description = 'Resync the seeded system roles (Owner, Admin, Member) of every tenant to the current PermissionCatalog. Detects drift caused by adding new permissions without re-provisioning existing tenants. Dry-run by default.';

    /**
     * Map seeded role name → catalog method that returns the canonical permission set.
     *
     * @var array<string, callable>
     */
    private const ROLE_CATALOG = [
        'Owner' => [PermissionCatalog::class, 'ownerPermissions'],
        'Admin' => [PermissionCatalog::class, 'adminPermissions'],
        'Member' => [PermissionCatalog::class, 'memberPermissions'],
    ];

    public function handle(PermissionRegistrar $registrar): int
    {
        $apply = (bool) $this->option('apply');

        if (! $apply) {
            $this->warn('🔍 DRY RUN — pass --apply to persist changes');
        }

        $tenants = Tenant::query()->orderBy('id')->get();
        if ($tenants->isEmpty()) {
            $this->info('No tenants.');

            return Command::SUCCESS;
        }

        $rows = [];
        $totals = ['synced' => 0, 'in_sync' => 0, 'missing_role' => 0];

        foreach ($tenants as $tenant) {
            $registrar->setPermissionsTeamId($tenant->id);
            $registrar->forgetCachedPermissions();

            $ownerRoleId = $tenant->owner_role_id;

            foreach (self::ROLE_CATALOG as $seededName => $catalogCallback) {
                // For the Owner role we resolve by tenant.owner_role_id so renamed
                // owner roles (e.g. "Dueño") are still tracked. For Admin/Member we
                // resolve by name, but skip any role that is already the tenant's
                // Owner — otherwise a role literally named "Admin" that happens to
                // be the Owner would be downgraded to Admin permissions on the
                // second pass.
                if ($seededName === 'Owner') {
                    $role = $ownerRoleId !== null
                        ? Role::query()->where('id', $ownerRoleId)->where('tenant_id', $tenant->id)->first()
                        : null;
                } else {
                    $role = Role::query()
                        ->where('tenant_id', $tenant->id)
                        ->where('name', $seededName)
                        ->when($ownerRoleId !== null, fn ($q) => $q->where('id', '!=', $ownerRoleId))
                        ->first();
                }

                if ($role === null) {
                    $totals['missing_role']++;
                    $rows[] = [$tenant->id, $seededName, '—', '—', 'missing'];

                    continue;
                }

                $expected = $catalogCallback();
                $current = $role->permissions->pluck('name')->all();

                $missing = array_values(array_diff($expected, $current));
                $extra = array_values(array_diff($current, $expected));

                if ($missing === [] && $extra === []) {
                    $totals['in_sync']++;
                    $rows[] = [$tenant->id, $role->name, count($current), '0 / 0', 'in sync'];

                    continue;
                }

                if ($apply) {
                    $role->syncPermissions($expected);
                }
                $totals['synced']++;
                $rows[] = [
                    $tenant->id,
                    $role->name,
                    count($expected),
                    count($missing).' / '.count($extra),
                    $apply ? 'synced' : 'WOULD SYNC',
                ];
            }
        }

        $this->newLine();
        $this->table(
            ['Tenant', 'Role', 'Target perms', 'Missing / Extra', 'Status'],
            $rows,
        );

        $this->newLine();
        $this->table(
            ['Metric', 'Count'],
            [
                ['Roles in sync', $totals['in_sync']],
                ['Roles '.($apply ? 'synced' : 'to sync'), $totals['synced']],
                ['Roles missing (will not provision here)', $totals['missing_role']],
            ],
        );

        if (! $apply && $totals['synced'] > 0) {
            $this->warn('Re-run with --apply to commit changes.');
        }

        $registrar->forgetCachedPermissions();

        return Command::SUCCESS;
    }
}
