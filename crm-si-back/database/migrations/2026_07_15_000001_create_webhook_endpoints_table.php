<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhook_endpoints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->string('name');
            $table->string('slug');
            // Tabla destino del upsert. v1 solo soporta 'contacts'; la columna deja
            // la puerta abierta a otras tablas sin romper el esquema.
            $table->string('target')->default('contacts');
            // Solo se persiste el hash sha256 de la API key (lookup O(1) por el
            // índice único). El valor en plano se muestra una única vez al crear/rotar.
            $table->string('api_key_hash', 64);
            // Prefijo visible de la key (whk_xxxx) para identificarla en la UI sin
            // revelar el secreto.
            $table->string('api_key_prefix', 12);
            // Secret HMAC opcional por endpoint, encriptado con Crypt. Si está
            // seteado, la firma X-Signature-256 pasa a ser obligatoria.
            $table->text('signing_secret')->nullable();
            $table->boolean('enabled')->default(true);
            $table->timestamp('last_received_at')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'slug']);
            $table->unique('api_key_hash');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_endpoints');
    }
};
