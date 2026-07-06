<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->boolean('ai_autoreply_enabled')->default(false)->after('pipeline_stage_id');
        });

        Schema::table('whatsapp_configs', function (Blueprint $table) {
            $table->boolean('ai_autoreply_default')->default(false)->after('registration_pin');
            $table->text('ai_system_prompt')->nullable()->after('ai_autoreply_default');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropColumn('ai_autoreply_enabled');
        });

        Schema::table('whatsapp_configs', function (Blueprint $table) {
            $table->dropColumn(['ai_autoreply_default', 'ai_system_prompt']);
        });
    }
};
