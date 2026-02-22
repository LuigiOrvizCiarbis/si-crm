<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('channel_id')->constrained('channels')->onDelete('cascade');
            $table->string('phone_number_id');
            $table->string('display_phone_number')->nullable();
            $table->string('waba_id');
            $table->string('verify_token')->nullable();
            $table->longText('bussines_token');
            $table->timestamps();
            $table->index('phone_number_id');
            $table->index('waba_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_configs');
    }
};
