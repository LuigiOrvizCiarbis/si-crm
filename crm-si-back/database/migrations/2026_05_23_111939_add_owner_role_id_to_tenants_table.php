<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->unsignedBigInteger('owner_role_id')->nullable()->after('id');
            $table->foreign('owner_role_id')
                ->references('id')
                ->on('roles')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropForeign(['owner_role_id']);
            $table->dropColumn('owner_role_id');
        });
    }
};
