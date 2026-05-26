<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackfillTenantOwnerRole extends Command
{
    protected $signature = 'tenants:backfill-owner-role
                            {--apply : Persist changes. Without this flag the command runs as a dry run}
                            {--force-resync : Re-evaluate tenants that already have owner_role_id set}';

    protected $description = 'Pick the Owner role for each tenant (heuristic: role of the tenant\'s oldest user) and write it to tenants.owner_role_id. Dry-run by default.';

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');
        $forceResync = (bool) $this->option('force-resync');

        if (! $apply) {
            $this->warn('🔍 DRY RUN — pass --apply to persist changes');
        }

        $tenants = Tenant::query()->orderBy('id')->get();

        if ($tenants->isEmpty()) {
            $this->info('No tenants.');

            return Command::SUCCESS;
        }

        $rows = [];
        $totals = ['set' => 0, 'skipped_already_set' => 0, 'skipped_no_candidate' => 0, 'diverged' => 0];

        foreach ($tenants as $tenant) {
            if ($tenant->owner_role_id !== null && ! $forceResync) {
                $totals['skipped_already_set']++;
                $rows[] = [$tenant->id, $tenant->name, $tenant->owner_role_id, '—', '—', 'already set'];

                continue;
            }

            $oldestUserRoleId = $this->roleOfOldestUser($tenant->id);
            $topPermRoleId = $this->roleWithMostPermissions($tenant->id);

            if ($oldestUserRoleId === null && $topPermRoleId === null) {
                $totals['skipped_no_candidate']++;
                $rows[] = [$tenant->id, $tenant->name, null, '—', '—', 'no candidate'];

                continue;
            }

            $pick = $oldestUserRoleId ?? $topPermRoleId;
            $divergence = ($oldestUserRoleId !== null && $topPermRoleId !== null && $oldestUserRoleId !== $topPermRoleId)
                ? 'YES'
                : 'no';
            if ($divergence === 'YES') {
                $totals['diverged']++;
            }

            if ($apply) {
                $tenant->forceFill(['owner_role_id' => $pick])->save();
            }
            $totals['set']++;

            $rows[] = [
                $tenant->id,
                $tenant->name,
                $pick,
                $oldestUserRoleId ?? 'null',
                $topPermRoleId ?? 'null',
                $divergence,
            ];
        }

        $this->newLine();
        $this->table(
            ['Tenant', 'Name', 'Picked role_id', 'Oldest-user role', 'Top-perm role', 'Diverged'],
            $rows,
        );

        $this->newLine();
        $this->table(
            ['Metric', 'Count'],
            [
                ['Set', $totals['set']],
                ['Skipped (already set)', $totals['skipped_already_set']],
                ['Skipped (no candidate)', $totals['skipped_no_candidate']],
                ['Diverged (heuristics disagreed)', $totals['diverged']],
            ],
        );

        if ($totals['diverged'] > 0) {
            $this->warn('⚠️  Some tenants have heuristic divergence. Review before trusting the result.');
        }

        if (! $apply) {
            $this->warn('Re-run with --apply to commit changes.');
        }

        return Command::SUCCESS;
    }

    /**
     * Role assigned to the earliest-created user of the tenant. If that user
     * carries multiple roles, prefer is_system=true and the role with the most
     * permissions to break ties.
     */
    private function roleOfOldestUser(int $tenantId): ?int
    {
        $oldestUser = User::query()
            ->where('tenant_id', $tenantId)
            ->orderBy('id')
            ->first();

        if ($oldestUser === null) {
            return null;
        }

        $roleId = DB::table('model_has_roles as mhr')
            ->join('roles as r', 'r.id', '=', 'mhr.role_id')
            ->leftJoin('role_has_permissions as rhp', 'rhp.role_id', '=', 'r.id')
            ->where('mhr.model_id', $oldestUser->id)
            ->where('mhr.model_type', User::class)
            ->where('mhr.tenant_id', $tenantId)
            ->groupBy('r.id', 'r.is_system')
            ->orderByDesc('r.is_system')
            ->orderByDesc(DB::raw('COUNT(rhp.permission_id)'))
            ->orderBy('r.id')
            ->value('r.id');

        return $roleId !== null ? (int) $roleId : null;
    }

    /**
     * System role with the most permissions for the tenant. Tie broken by id.
     */
    private function roleWithMostPermissions(int $tenantId): ?int
    {
        $roleId = DB::table('roles as r')
            ->leftJoin('role_has_permissions as rhp', 'rhp.role_id', '=', 'r.id')
            ->where('r.tenant_id', $tenantId)
            ->where('r.is_system', true)
            ->groupBy('r.id')
            ->orderByDesc(DB::raw('COUNT(rhp.permission_id)'))
            ->orderBy('r.id')
            ->value('r.id');

        return $roleId !== null ? (int) $roleId : null;
    }
}
