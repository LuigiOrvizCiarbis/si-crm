<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            // Estado de entrega reportado por el webhook de status de Meta. Hasta
            // ahora el evento `failed` solo se logueaba y se perdía: el mensaje
            // quedaba "enviado" en el CRM aunque Meta lo hubiera descartado.
            $table->timestamp('failed_at')->nullable()->after('read_at');
            $table->text('error_message')->nullable()->after('failed_at');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['failed_at', 'error_message']);
        });
    }
};
