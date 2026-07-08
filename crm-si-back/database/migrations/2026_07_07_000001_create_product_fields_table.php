<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->string('key', 64);
            $table->string('label', 120);
            $table->string('type', 20);
            $table->json('options')->nullable();
            $table->boolean('is_required')->default(false);
            $table->boolean('is_unique')->default(false);
            $table->unsignedSmallInteger('display_order')->default(0);
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['tenant_id', 'key']);
            $table->index(['tenant_id', 'display_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_fields');
    }
};
