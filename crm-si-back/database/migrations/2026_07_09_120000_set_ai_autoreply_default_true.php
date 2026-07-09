<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * El asistente virtual debe quedar activo por defecto para que el primer
     * mensaje de una conversación nueva ya pueda contestarlo la IA. Cambiamos el
     * default de la columna y hacemos backfill de los canales existentes que
     * seguían en false por el default viejo.
     */
    public function up(): void
    {
        Schema::table('whatsapp_configs', function (Blueprint $table) {
            $table->boolean('ai_autoreply_default')->default(true)->change();
        });

        DB::table('whatsapp_configs')
            ->where('ai_autoreply_default', false)
            ->update(['ai_autoreply_default' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('whatsapp_configs', function (Blueprint $table) {
            $table->boolean('ai_autoreply_default')->default(false)->change();
        });
    }
};
