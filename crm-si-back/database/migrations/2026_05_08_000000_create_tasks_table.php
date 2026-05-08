<?php

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\TaskType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('contact_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->foreignId('conversation_id')->nullable()->constrained('conversations')->nullOnDelete();
            $table->foreignId('opportunity_id')->nullable()->constrained('opportunities')->nullOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->enum('status', TaskStatus::values())->default(TaskStatus::NEW->value);
            $table->enum('priority', TaskPriority::values())->default(TaskPriority::MEDIUM->value);
            $table->enum('type', TaskType::values())->default(TaskType::FOLLOW_UP->value);
            $table->timestamp('deadline')->nullable();
            $table->text('description')->nullable();
            $table->json('reminders')->nullable();
            $table->string('recurrence')->nullable();
            $table->json('depends_on')->nullable();
            $table->json('checklist')->nullable();
            $table->json('attachments')->nullable();
            $table->json('synced_calendars')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'assigned_to']);
            $table->index(['tenant_id', 'deadline']);
            $table->index(['tenant_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
