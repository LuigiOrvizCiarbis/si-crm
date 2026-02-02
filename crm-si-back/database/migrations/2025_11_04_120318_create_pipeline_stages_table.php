<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pipeline_stages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('sort_order')->default(0); // Para ordenar columnas
            $table->boolean('is_default')->default(false); // Para identificar la etapa inicial
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade')->index();

            $table->timestamps();

        });
    }

    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropForeign(['pipeline_stage_id']);
            $table->dropColumn('pipeline_stage_id');
        });
        Schema::dropIfExists('pipeline_stages');
    }
};
