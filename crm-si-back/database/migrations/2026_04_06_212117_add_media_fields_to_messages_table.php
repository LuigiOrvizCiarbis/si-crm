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
        Schema::table('messages', function (Blueprint $table) {
            $table->string('message_type', 20)->default('text')->after('content');
            $table->text('media_url')->nullable()->after('message_type');
            $table->string('media_mime_type', 100)->nullable()->after('media_url');
            $table->string('media_filename', 255)->nullable()->after('media_mime_type');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['message_type', 'media_url', 'media_mime_type', 'media_filename']);
        });
    }
};
