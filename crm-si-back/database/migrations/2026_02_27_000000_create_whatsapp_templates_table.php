<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('whatsapp_config_id')->constrained('whatsapp_configs')->onDelete('cascade');
            $table->string('external_id');
            $table->string('name');
            $table->string('language');
            $table->string('category');
            $table->string('status');
            $table->json('components')->nullable();
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();

            $table->index(['whatsapp_config_id', 'status']);
            $table->index('external_id');
            $table->unique(['whatsapp_config_id', 'name', 'language']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_templates');
    }
};
