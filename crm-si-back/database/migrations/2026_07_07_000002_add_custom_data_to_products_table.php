<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->json('custom_data')->nullable()->after('external_id');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE products ALTER COLUMN custom_data TYPE jsonb USING custom_data::jsonb');
            DB::statement("UPDATE products SET custom_data = '{}'::jsonb WHERE custom_data IS NULL");
            DB::statement('ALTER TABLE products ALTER COLUMN custom_data SET DEFAULT \'{}\'::jsonb');
            DB::statement('ALTER TABLE products ALTER COLUMN custom_data SET NOT NULL');
            DB::statement('CREATE INDEX products_custom_data_gin ON products USING GIN (custom_data jsonb_path_ops)');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS products_custom_data_gin');
        }

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('custom_data');
        });
    }
};
