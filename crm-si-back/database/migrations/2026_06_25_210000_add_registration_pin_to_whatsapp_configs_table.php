<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('whatsapp_configs', function (Blueprint $table) {
            // PIN de verificación en dos pasos generado por nosotros al registrar
            // el número en Cloud API (POST /register). Lo guardamos encriptado porque
            // Meta puede pedirlo en re-registros futuros (el número ya tendrá two-step).
            $table->longText('registration_pin')->nullable()->after('bussines_token');
        });
    }

    public function down(): void
    {
        Schema::table('whatsapp_configs', function (Blueprint $table) {
            $table->dropColumn('registration_pin');
        });
    }
};
