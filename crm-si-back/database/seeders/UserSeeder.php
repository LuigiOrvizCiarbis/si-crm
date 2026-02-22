<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear Tenant
        $tenant = Tenant::create([
            'name' => 'Demo Company',
            'plan' => 'free',
            'timezone' => 'UTC',
        ]);

        // Crear Usuario Admin
        User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Admin User',
            'email' => 'admin@demo.com',
            'password' => bcrypt('password'),
            'role' => 1, // Admin
        ]);

        // Crear Usuario Regular
        User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Vendedor 1',
            'email' => 'vendedor1@demo.com',
            'password' => bcrypt('password'),
            'role' => 2, // User
        ]);

         User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Vendedor 2',
            'email' => 'vendedor2@demo.com',
            'password' => bcrypt('password'),
            'role' => 2, // User
        ]);

        // Crear Usuario Reviewer (para Meta App Review)
        User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Meta Reviewer',
            'email' => 'reviewer@sicrmapp.com',
            'password' => bcrypt('Reviewers2026'),
            'email_verified_at' => now(),
            'role' => 1, // Admin
        ]);

        $this->command->info('✅ Tenant y usuarios creados exitosamente');
        $this->command->info('📧 Admin: admin@demo.com | password: password');
        $this->command->info('📧 Reviewer: reviewer@sicrmapp.com | password: Reviewers2026');
        $this->command->info('📧 User: test@demo.com | password: password');
    }
}
