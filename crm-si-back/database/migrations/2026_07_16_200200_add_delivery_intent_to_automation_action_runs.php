<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('automation_action_runs', function (Blueprint $table): void {
            $table->string('delivery_key', 64)->nullable()->unique()->after('attempts');
            $table->timestampTz('delivery_started_at')->nullable()->after('delivery_key');
            $table->timestampTz('delivery_confirmed_at')->nullable()->after('delivery_started_at');
        });
    }

    public function down(): void
    {
        Schema::table('automation_action_runs', function (Blueprint $table): void {
            $table->dropUnique(['delivery_key']);
            $table->dropColumn(['delivery_key', 'delivery_started_at', 'delivery_confirmed_at']);
        });
    }
};
