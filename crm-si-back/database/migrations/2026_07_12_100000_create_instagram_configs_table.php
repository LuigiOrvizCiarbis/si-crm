<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('instagram_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            // ID del usuario de Instagram (IG business account). Clave de resolución
            // del webhook y del canal. Único: una cuenta IG = una config.
            $table->string('ig_user_id')->unique();
            // ID de la página de Facebook vinculada. Se usa como {page_id} en el
            // endpoint de envío y para suscribir webhooks.
            $table->string('page_id')->index();
            // Identificador flexible con el que llega el webhook (entry.id). No
            // asumimos que sea siempre ig_user_id; lo persistimos al primer match.
            $table->string('webhook_object_id')->nullable()->index();
            $table->string('username')->nullable();
            // Page access token long-lived (derivado del user token extendido).
            // No expira periódicamente pero puede invalidarse. Encriptado con Crypt.
            $table->longText('page_access_token');
            $table->boolean('ai_autoreply_default')->default(false);
            $table->text('ai_system_prompt')->nullable();
            $table->timestamps();
        });

        Schema::table('channels', function (Blueprint $table) {
            $table->foreignId('instagram_config_id')
                ->nullable()
                ->after('whatsapp_config_id')
                ->constrained('instagram_configs')
                ->nullOnDelete();

            // El modelo Channel ya declaraba external_id en fillable/docblock,
            // pero la columna nunca se había creado (WhatsApp usa whatsapp_config_id).
            // Instagram identifica el canal por el IGSID del negocio, que guardamos acá.
            if (! Schema::hasColumn('channels', 'external_id')) {
                $table->string('external_id')->nullable()->after('type')->index();
            }
        });

        // Índice único parcial para contactos identificados por external_id
        // (WhatsApp SMB por BSUID, Instagram por IGSID). Evita duplicados de un
        // mismo external_id dentro de un tenant y misma fuente. WHERE external_id
        // IS NOT NULL: los contactos manuales/por teléfono no tienen external_id.
        DB::statement(
            'CREATE UNIQUE INDEX contacts_tenant_source_external_unique '.
            'ON contacts (tenant_id, source, external_id) '.
            'WHERE external_id IS NOT NULL'
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS contacts_tenant_source_external_unique');

        Schema::table('channels', function (Blueprint $table) {
            $table->dropForeign(['instagram_config_id']);
            $table->dropColumn('instagram_config_id');

            if (Schema::hasColumn('channels', 'external_id')) {
                $table->dropColumn('external_id');
            }
        });

        Schema::dropIfExists('instagram_configs');
    }
};
