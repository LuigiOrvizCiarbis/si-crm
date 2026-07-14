<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table): void {
            $table->string('contact_language', 5)->nullable()->after('ai_autoreply_enabled');
        });

        Schema::create('message_translations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('message_id')->constrained()->cascadeOnDelete();
            $table->string('target_language', 5);
            $table->text('translated_content');
            $table->string('source_hash', 64);
            $table->timestamps();

            $table->unique(['message_id', 'target_language']);
            $table->index(['tenant_id', 'target_language']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_translations');

        Schema::table('conversations', function (Blueprint $table): void {
            $table->dropColumn('contact_language');
        });
    }
};
