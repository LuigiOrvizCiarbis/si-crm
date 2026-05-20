<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Models\User;
use App\Support\RoleProvisioner;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

class MigrateUsersToSpatieRoles extends Command
{
    protected $signature = 'roles:migrate-from-enum
                            {--dry-run : Simular sin hacer cambios}
                            {--force-resync : Re-mapear usuarios que ya tienen rol Owner/Admin/Member según su legacy users.role}';

    protected $description = 'Provisiona roles Owner/Admin/Member por tenant y migra users.role enum a Spatie roles. Primer ADMIN del tenant → Owner; resto ADMIN/null → Admin; EMPLOYEE → Member.';

    private const LEGACY_ADMIN = 1;

    private const LEGACY_EMPLOYEE = 2;

    public function handle(RoleProvisioner $provisioner, PermissionRegistrar $registrar): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $forceResync = (bool) $this->option('force-resync');

        if ($dryRun) {
            $this->warn('🔍 Modo DRY RUN — no se aplicarán cambios');
        }
        if ($forceResync) {
            $this->warn('♻️  Modo FORCE-RESYNC — usuarios ya migrados serán re-mapeados según su legacy users.role');
        }

        $tenants = Tenant::query()->orderBy('id')->get();

        if ($tenants->isEmpty()) {
            $this->info('No hay tenants.');

            return Command::SUCCESS;
        }

        $totals = [
            'Owner' => 0,
            'Admin' => 0,
            'Member' => 0,
            'skipped' => 0,
        ];

        foreach ($tenants as $tenant) {
            $this->info("Tenant #{$tenant->id} — {$tenant->name}");

            if (! $dryRun) {
                $provisioner->provisionDefaultRoles($tenant);
            }

            $registrar->setPermissionsTeamId($tenant->id);

            $users = User::query()
                ->where('tenant_id', $tenant->id)
                ->orderBy('id')
                ->get();

            if ($users->isEmpty()) {
                $this->line('  · sin usuarios');

                continue;
            }

            // Resolve the legacy ADMIN that should become the tenant Owner: the
            // earliest-created user whose legacy role was admin (or null, since
            // historical registrations stored null for the first admin).
            $ownerCandidateId = $users
                ->first(fn (User $u) => $u->role === null || (int) $u->role === self::LEGACY_ADMIN)
                ?->id;

            DB::transaction(function () use ($users, $ownerCandidateId, &$totals, $dryRun, $forceResync): void {
                foreach ($users as $user) {
                    $targetRole = $this->resolveTargetRole($user, $ownerCandidateId);
                    $currentRole = $user->roles->first()?->name;

                    if ($currentRole !== null && ! $forceResync) {
                        $totals['skipped']++;
                        $this->line("  · user #{$user->id} ya tiene rol ({$currentRole}) — skip");

                        continue;
                    }

                    if ($currentRole === $targetRole) {
                        $totals['skipped']++;
                        $this->line("  · user #{$user->id} ya está en {$targetRole} — skip");

                        continue;
                    }

                    if (! $dryRun) {
                        $user->syncRoles([$targetRole]);
                    }

                    $totals[$targetRole]++;
                    $legacy = $user->role === null ? 'null' : (string) $user->role;
                    $note = $currentRole !== null ? " (was {$currentRole})" : '';
                    $this->line("  · user #{$user->id} (legacy={$legacy}) → {$targetRole}{$note}");
                }
            });
        }

        $this->newLine();
        $this->table(
            ['Métrica', 'Cantidad'],
            [
                ['Tenants procesados', $tenants->count()],
                ['Owners asignados', $totals['Owner']],
                ['Admins asignados', $totals['Admin']],
                ['Members asignados', $totals['Member']],
                ['Usuarios saltados (ya con rol)', $totals['skipped']],
            ],
        );

        if ($dryRun) {
            $this->warn('Para aplicar, vuelve a ejecutar sin --dry-run');
        }

        return Command::SUCCESS;
    }

    /**
     * Decide which seeded role a user should receive based on their legacy
     * `users.role` enum and whether they are the chosen Owner candidate.
     */
    private function resolveTargetRole(User $user, ?int $ownerCandidateId): string
    {
        if ($ownerCandidateId !== null && $user->id === $ownerCandidateId) {
            return 'Owner';
        }

        $legacy = $user->role;

        if ($legacy === null) {
            // Historical registration path stored null for the workspace creator.
            // If we already picked an Owner, fall back to Admin.
            return 'Admin';
        }

        if ((int) $legacy === self::LEGACY_EMPLOYEE) {
            return 'Member';
        }

        return 'Admin';
    }
}
