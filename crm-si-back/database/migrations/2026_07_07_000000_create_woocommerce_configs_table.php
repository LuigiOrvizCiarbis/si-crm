<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('woocommerce_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->string('store_url');
            // Credenciales de la REST API de WooCommerce, encriptadas (Consumer Key/Secret).
            $table->text('consumer_key')->nullable();
            $table->text('consumer_secret')->nullable();
            $table->boolean('enabled')->default(false);
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->unique('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('woocommerce_configs');
    }
};
