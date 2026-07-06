<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Los mensajes del sistema (respuestas de IA, SenderType::SYSTEM) no apuntan
     * a ninguna entidad, así que no tienen sender_id. La columna venía como
     * NOT NULL por morphs('sender'), lo que hacía fallar el insert del job de
     * auto-respuesta. Se relaja sender_id a nullable.
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table): void {
            $table->unsignedBigInteger('sender_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Solo reversible si no hay mensajes con sender_id nulo (los de sistema).
        Schema::table('messages', function (Blueprint $table): void {
            $table->unsignedBigInteger('sender_id')->nullable(false)->change();
        });
    }
};
