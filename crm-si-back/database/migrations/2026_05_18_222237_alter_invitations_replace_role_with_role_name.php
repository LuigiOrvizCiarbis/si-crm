<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invitations', function (Blueprint $table) {
            $table->string('role_name', 100)->nullable()->after('token');
        });

        DB::table('invitations')->where('role', 1)->update(['role_name' => 'Owner']);
        DB::table('invitations')->where('role', 2)->update(['role_name' => 'Admin']);

        Schema::table('invitations', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }

    public function down(): void
    {
        Schema::table('invitations', function (Blueprint $table) {
            $table->tinyInteger('role')->default(2);
        });

        DB::table('invitations')->where('role_name', 'Owner')->update(['role' => 1]);
        DB::table('invitations')->where('role_name', 'Admin')->update(['role' => 2]);

        Schema::table('invitations', function (Blueprint $table) {
            $table->dropColumn('role_name');
        });
    }
};
