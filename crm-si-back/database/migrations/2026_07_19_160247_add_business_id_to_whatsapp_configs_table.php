<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * business_id es el ID del Business Portfolio (Business Manager) de Meta,
     * dueño del WABA. Se usa para leer el verification_status del negocio.
     * No es secreto: no se encripta. El front ya lo envía en el onboarding.
     */
    public function up(): void
    {
        Schema::table('whatsapp_configs', function (Blueprint $table) {
            $table->string('business_id')->nullable()->after('waba_id')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('whatsapp_configs', function (Blueprint $table) {
            $table->dropIndex(['business_id']);
            $table->dropColumn('business_id');
        });
    }
};
