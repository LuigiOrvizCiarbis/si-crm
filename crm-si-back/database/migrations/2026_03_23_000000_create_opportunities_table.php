<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opportunities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('contact_id')->constrained('contacts')->onDelete('cascade');
            $table->foreignId('conversation_id')->nullable()->constrained('conversations')->nullOnDelete();
            $table->foreignId('pipeline_stage_id')->nullable()->constrained('pipeline_stages')->nullOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->enum('status', ['open', 'won', 'lost', 'archived'])->default('open');
            $table->enum('source_type', ['manual', 'conversation'])->default('manual');
            $table->decimal('value', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'pipeline_stage_id']);
            $table->index(['tenant_id', 'contact_id']);
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunities');
    }
};
