<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->timestamp('starts_at')->nullable()->after('deadline');
            $table->timestamp('ends_at')->nullable()->after('starts_at');
            $table->string('meeting_timezone')->nullable()->after('ends_at');
            $table->string('meeting_guest_email')->nullable()->after('meeting_timezone');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['starts_at', 'ends_at', 'meeting_timezone', 'meeting_guest_email']);
        });
    }
};
