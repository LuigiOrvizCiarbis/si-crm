<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProductionSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed only production-safe operational data.
     */
    public function run(): void
    {
        $this->call([
            PermissionSeeder::class,
            PipelineStageSeeder::class,
        ]);
    }
}
