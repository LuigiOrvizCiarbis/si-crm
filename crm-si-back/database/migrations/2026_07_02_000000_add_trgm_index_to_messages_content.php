<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    public function up(): void
    {
        // pg_trgm acelera ILIKE '%...%' con índice GIN. Si el usuario de DB no puede
        // crear extensiones, la búsqueda funciona igual con seq scan.
        // Mejora futura para acentos: índice funcional sobre unaccent(content).
        try {
            DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');
            DB::statement('CREATE INDEX IF NOT EXISTS messages_content_trgm_idx ON messages USING gin (content gin_trgm_ops)');
        } catch (Throwable $e) {
            Log::warning('No se pudo crear el índice pg_trgm sobre messages.content: '.$e->getMessage());
        }
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS messages_content_trgm_idx');
    }
};
