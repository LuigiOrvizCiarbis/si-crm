<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->morphs('sender');
            $table->text('content');
            $table->enum('direction', ['inbound', 'outbound']);
            $table->string('external_id')->nullable()->unique();
            $table->timestamp('delivered_at')->nullable();
            $table->foreignId('conversation_id')->nullable()->constrained('conversations')->onDelete('set null');

            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            // Índices para mejorar rendimiento
            $table->index(['conversation_id', 'created_at']);
            $table->index(['tenant_id', 'created_at']);
            $table->index('external_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
