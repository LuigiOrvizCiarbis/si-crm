<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('automation_rules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->string('status')->default('draft');
            $table->unsignedInteger('version')->default(1);
            $table->string('trigger_type');
            $table->json('trigger_config')->default('{}');
            $table->json('conditions')->nullable();
            $table->string('timezone');
            $table->timestampTz('activated_at')->nullable();
            $table->timestampsTz();
            $table->index(['tenant_id', 'status', 'trigger_type']);
        });

        Schema::create('automation_actions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('automation_rule_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('position');
            $table->string('type');
            $table->json('config')->default('{}');
            $table->timestampsTz();
            $table->unique(['automation_rule_id', 'position']);
        });

        Schema::create('automation_runs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('automation_rule_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('rule_version');
            $table->string('status');
            $table->string('subject_type');
            $table->unsignedBigInteger('subject_id');
            $table->uuid('event_id')->nullable();
            $table->unsignedInteger('recurrence_number')->default(0);
            $table->string('deduplication_key', 64)->unique();
            $table->json('context')->default('{}');
            $table->json('result')->nullable();
            $table->text('error')->nullable();
            $table->timestampTz('scheduled_for')->nullable();
            $table->timestampTz('queued_at')->nullable();
            $table->timestampTz('started_at')->nullable();
            $table->timestampTz('finished_at')->nullable();
            $table->unsignedInteger('attempts')->default(0);
            $table->timestampsTz();
            $table->index(['tenant_id', 'status', 'scheduled_for']);
            $table->index(['automation_rule_id', 'created_at']);
            $table->index(['subject_type', 'subject_id']);
        });

        Schema::create('automation_action_runs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('automation_run_id')->constrained()->cascadeOnDelete();
            $table->foreignId('automation_action_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('position');
            $table->string('status');
            $table->unsignedInteger('attempts')->default(0);
            $table->json('input')->nullable();
            $table->json('result')->nullable();
            $table->text('error')->nullable();
            $table->timestampTz('started_at')->nullable();
            $table->timestampTz('finished_at')->nullable();
            $table->timestampsTz();
            $table->unique(['automation_run_id', 'automation_action_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('automation_action_runs');
        Schema::dropIfExists('automation_runs');
        Schema::dropIfExists('automation_actions');
        Schema::dropIfExists('automation_rules');
    }
};
