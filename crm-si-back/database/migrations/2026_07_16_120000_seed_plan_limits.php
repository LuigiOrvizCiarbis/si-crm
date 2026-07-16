<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Contenido comercial de los planes para la página /pricing. Vive en `limits`
// (JSON) para poder ajustarse desde la DB sin deploy. `features` alimenta las
// cards (label = fallback en español si falta la traducción en el front) y
// `compare` alimenta la tabla comparativa (valores: número, "custom" o bool).
return new class extends Migration
{
    public function up(): void
    {
        $limits = [
            'free' => [
                'features' => [
                    ['key' => 'users_1', 'label' => '1 usuario'],
                    ['key' => 'channel_accounts_1', 'label' => '1 cuenta por canal'],
                    ['key' => 'contacts_csv', 'label' => 'Contactos e importación CSV'],
                    ['key' => 'realtime_inbox', 'label' => 'Bandeja multicanal en tiempo real'],
                    ['key' => 'pipeline_kanban', 'label' => 'Pipeline de ventas con Kanban'],
                ],
                'compare' => [
                    'users' => '1',
                    'channel_accounts' => '1',
                    'conversations_month' => '3000',
                    'ai' => false,
                ],
            ],
            'pro' => [
                'features' => [
                    ['key' => 'everything_free', 'label' => 'Todo lo del plan Free'],
                    ['key' => 'team_roles', 'label' => 'Equipo con roles y permisos'],
                    ['key' => 'multi_channel_accounts', 'label' => 'Múltiples cuentas por canal'],
                    ['key' => 'ai_autoreply', 'label' => 'Chatbot IA con tu propia API key'],
                    ['key' => 'product_catalog', 'label' => 'Catálogo de productos'],
                    ['key' => 'webhooks', 'label' => 'Webhooks entrantes y salientes'],
                    ['key' => 'custom_fields', 'label' => 'Campos personalizados'],
                ],
                'compare' => [
                    'users' => 'custom',
                    'channel_accounts' => 'custom',
                    'conversations_month' => 'custom',
                    'ai' => true,
                ],
            ],
            'enterprise' => [
                'features' => [
                    ['key' => 'everything_pro', 'label' => 'Todo lo del plan Pro'],
                    ['key' => 'custom_limits', 'label' => 'Límites a medida'],
                    ['key' => 'priority_support', 'label' => 'Soporte prioritario'],
                    ['key' => 'custom_integrations', 'label' => 'Integraciones a medida'],
                ],
                'compare' => [
                    'users' => 'custom',
                    'channel_accounts' => 'custom',
                    'conversations_month' => 'custom',
                    'ai' => true,
                ],
            ],
        ];

        foreach ($limits as $key => $value) {
            DB::table('plans')
                ->where('key', $key)
                ->update(['limits' => json_encode($value), 'updated_at' => now()]);
        }
    }

    public function down(): void
    {
        DB::table('plans')
            ->whereIn('key', ['free', 'pro', 'enterprise'])
            ->update(['limits' => null, 'updated_at' => now()]);
    }
};
