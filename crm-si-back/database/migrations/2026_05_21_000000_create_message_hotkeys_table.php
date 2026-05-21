<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_hotkeys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->string('trigger', 64);
            $table->text('content');
            $table->string('description')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'user_id']);
        });

        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement(
                'CREATE UNIQUE INDEX message_hotkeys_tenant_trigger_unique
                 ON message_hotkeys (tenant_id, trigger)
                 WHERE user_id IS NULL'
            );
            DB::statement(
                'CREATE UNIQUE INDEX message_hotkeys_user_trigger_unique
                 ON message_hotkeys (tenant_id, user_id, trigger)
                 WHERE user_id IS NOT NULL'
            );
        } else {
            Schema::table('message_hotkeys', function (Blueprint $table) {
                $table->unique(['tenant_id', 'user_id', 'trigger'], 'message_hotkeys_scope_trigger_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('message_hotkeys');
    }
};
