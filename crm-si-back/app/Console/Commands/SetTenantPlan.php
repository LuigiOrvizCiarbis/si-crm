<?php

namespace App\Console\Commands;

use App\Models\Plan;
use App\Models\Tenant;
use Illuminate\Console\Command;

class SetTenantPlan extends Command
{
    /**
     * @var string
     */
    protected $signature = 'tenant:set-plan
                            {tenant : ID del tenant}
                            {plan : Key del plan (free|pro|enterprise)}
                            {--trial-days= : Si plan=free, setea/extiende el trial N días desde hoy}';

    /**
     * @var string
     */
    protected $description = 'Cambia el plan de un tenant (conversión manual, sin pasarela de pagos)';

    public function handle(): int
    {
        $tenant = Tenant::find((int) $this->argument('tenant'));

        if (! $tenant) {
            $this->error("Tenant #{$this->argument('tenant')} no encontrado.");

            return self::FAILURE;
        }

        $planKey = $this->argument('plan');
        $plan = Plan::where('key', $planKey)->first();

        if (! $plan) {
            $this->error("Plan '{$planKey}' no existe. Valores válidos: free, pro, enterprise.");

            return self::FAILURE;
        }

        $tenant->plan_id = $plan->id;

        if ($planKey === 'free') {
            $trialDays = $this->option('trial-days');
            $tenant->trial_ends_at = $trialDays !== null ? now()->addDays((int) $trialDays) : null;
        } else {
            $tenant->trial_ends_at = null;
        }

        $tenant->save();

        $this->info("Tenant #{$tenant->id} ({$tenant->name}) ahora es plan '{$plan->key}'.");
        $this->line($tenant->trial_ends_at
            ? "Trial vence: {$tenant->trial_ends_at->toDateTimeString()}"
            : 'Sin trial activo.');

        return self::SUCCESS;
    }
}
