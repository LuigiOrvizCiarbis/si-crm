<?php

namespace Database\Seeders;

use App\Models\PipelineStage;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class PipelineStageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener todos los tenants
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            // Verificar si ya existen stages para este tenant
            $existingStages = PipelineStage::where('tenant_id', $tenant->id)->count();

            if ($existingStages > 0) {
                $this->command->info("Tenant {$tenant->id} ({$tenant->name}) ya tiene stages configurados. Omitiendo...");
                continue;
            }

            $this->command->info("Creando stages para tenant {$tenant->id} ({$tenant->name})...");

            // Stages del pipeline de ventas estándar
            $stages = [
                [
                    'name' => 'Capturados',
                    'description' => 'Leads recién capturados que requieren calificación inicial',
                    'sort_order' => 1,
                    'is_default' => true,
                    'color' => '#3B82F6', // blue-500
                ],
                [
                    'name' => 'Calificados',
                    'description' => 'Leads calificados con potencial de conversión',
                    'sort_order' => 2,
                    'is_default' => false,
                    'color' => '#F59E0B', // yellow-500
                ],
                [
                    'name' => 'Negociación',
                    'description' => 'En proceso de negociación activa',
                    'sort_order' => 3,
                    'is_default' => false,
                    'color' => '#F97316', // orange-500
                ],
                [
                    'name' => 'Cierre',
                    'description' => 'Próximos a cerrar la venta',
                    'sort_order' => 4,
                    'is_default' => false,
                    'color' => '#10B981', // green-500
                ],
                [
                    'name' => 'Ganado',
                    'description' => 'Venta cerrada exitosamente',
                    'sort_order' => 5,
                    'is_default' => false,
                    'color' => '#059669', // green-600
                ],
                [
                    'name' => 'Perdido',
                    'description' => 'Oportunidad perdida',
                    'sort_order' => 6,
                    'is_default' => false,
                    'color' => '#EF4444', // red-500
                ],
            ];

            foreach ($stages as $stage) {
                PipelineStage::create([
                    'tenant_id' => $tenant->id,
                    'name' => $stage['name'],
                    'description' => $stage['description'],
                    'sort_order' => $stage['sort_order'],
                    'is_default' => $stage['is_default'],
                    'color' => $stage['color'],
                ]);
            }

            $stageCount = count($stages);
            $this->command->info("✓ {$stageCount} stages creados para tenant {$tenant->id}");
        }
    }
}
