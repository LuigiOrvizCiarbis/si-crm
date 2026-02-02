<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Cambia la relación de Channel hasOne WhatsAppConfig a WhatsAppConfig hasMany Channel
     */
    public function up(): void
    {
        // 1. Agregar columna whatsapp_config_id a channels
        Schema::table('channels', function (Blueprint $table) {
            $table->foreignId('whatsapp_config_id')->nullable()->after('user_id')->constrained('whatsapp_configs')->nullOnDelete();
        });

        // 2. Migrar datos existentes: channel_id en whatsapp_configs -> whatsapp_config_id en channels
        $configs = DB::table('whatsapp_configs')->get();
        foreach ($configs as $config) {
            DB::table('channels')
                ->where('id', $config->channel_id)
                ->update(['whatsapp_config_id' => $config->id]);
        }

        // 3. Eliminar columna channel_id de whatsapp_configs
        Schema::table('whatsapp_configs', function (Blueprint $table) {
            $table->dropForeign(['channel_id']);
            $table->dropColumn('channel_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Agregar channel_id a whatsapp_configs
        Schema::table('whatsapp_configs', function (Blueprint $table) {
            $table->foreignId('channel_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });

        // 2. Migrar datos de vuelta (tomar el primer canal asociado)
        $channels = DB::table('channels')->whereNotNull('whatsapp_config_id')->get();
        foreach ($channels as $channel) {
            DB::table('whatsapp_configs')
                ->where('id', $channel->whatsapp_config_id)
                ->whereNull('channel_id')
                ->update(['channel_id' => $channel->id]);
        }

        // 3. Eliminar columna whatsapp_config_id de channels
        Schema::table('channels', function (Blueprint $table) {
            $table->dropForeign(['whatsapp_config_id']);
            $table->dropColumn('whatsapp_config_id');
        });
    }
};
