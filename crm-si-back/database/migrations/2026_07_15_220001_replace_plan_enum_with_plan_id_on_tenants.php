<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->foreignId('plan_id')->nullable()->after('plan')->constrained('plans')->restrictOnDelete();
            $table->timestamp('trial_ends_at')->nullable()->after('plan_id');
        });

        $plans = DB::table('plans')->pluck('id', 'key');

        foreach ($plans as $key => $id) {
            DB::table('tenants')->where('plan', $key)->update(['plan_id' => $id]);
        }

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('plan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->enum('plan', ['free', 'pro', 'enterprise'])->default('free')->after('name');
        });

        $plans = DB::table('plans')->pluck('key', 'id');

        foreach ($plans as $id => $key) {
            DB::table('tenants')->where('plan_id', $id)->update(['plan' => $key]);
        }

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropConstrainedForeignId('plan_id');
            $table->dropColumn('trial_ends_at');
        });
    }
};
