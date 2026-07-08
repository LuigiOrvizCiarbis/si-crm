<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Support\ProductFieldProvisioner;
use Illuminate\Console\Command;

class SeedProductFields extends Command
{
    protected $signature = 'products:seed-fields
                            {--tenant= : ID del tenant específico (opcional)}';

    protected $description = 'Siembra los campos por defecto del catálogo (precio, descripción, activo) para los tenants existentes';

    public function handle(ProductFieldProvisioner $provisioner): int
    {
        $query = Tenant::query();

        if ($tenantId = $this->option('tenant')) {
            $query->whereKey($tenantId);
        }

        $tenants = $query->get();

        if ($tenants->isEmpty()) {
            $this->info('No hay tenants para procesar.');

            return Command::SUCCESS;
        }

        foreach ($tenants as $tenant) {
            $provisioner->seedDefaults($tenant);
            $this->line("✓ Campos por defecto sembrados para tenant {$tenant->id} ({$tenant->name})");
        }

        $this->info("Completado: {$tenants->count()} tenant(s) procesados.");

        return Command::SUCCESS;
    }
}
