<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhook_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('webhook_endpoint_id')->constrained('webhook_endpoints')->onDelete('cascade');
            // received | processed | partial | failed | rejected
            $table->string('status', 20);
            $table->unsignedSmallInteger('http_status')->nullable();
            // Payload recibido, truncado a ~64KB al guardar (DX de debug, no auditoría legal).
            $table->json('payload')->nullable();
            // Resultado del procesamiento: {created, updated, failed, errors[]}.
            $table->json('result')->nullable();
            $table->text('error')->nullable();
            $table->string('ip')->nullable();
            $table->timestamps();

            $table->index(['webhook_endpoint_id', 'created_at']);
            // Índice para la purga por antigüedad (model:prune).
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_deliveries');
    }
};
