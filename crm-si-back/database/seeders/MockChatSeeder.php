<?php

namespace Database\Seeders;

use App\Enums\ChannelType;
use App\Enums\MessageDirection;
use App\Enums\MessageType;
use App\Enums\SenderType;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class MockChatSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::query()->where('name', 'Demo Company')->first();
        if (! $tenant) {
            $this->command?->warn('MockChatSeeder: tenant "Demo Company" no encontrado. Corré UserSeeder primero.');

            return;
        }

        $owner = User::query()
            ->where('tenant_id', $tenant->id)
            ->where('email', 'admin@demo.com')
            ->first();

        if (! $owner) {
            $this->command?->warn('MockChatSeeder: usuario admin@demo.com no encontrado.');

            return;
        }

        $channel = Channel::query()
            ->where('tenant_id', $tenant->id)
            ->where('type', ChannelType::WHATSAPP)
            ->first();

        if (! $channel) {
            $channel = Channel::create([
                'tenant_id' => $tenant->id,
                'user_id' => $owner->id,
                'type' => ChannelType::WHATSAPP,
                'name' => 'WhatsApp Demo',
                'status' => 'active',
            ]);
        }

        $scripts = [
            [
                'contact' => ['name' => 'María González', 'phone' => '+5491122334455'],
                'messages' => [
                    ['in', 'Hola! Vi su anuncio en Instagram, quería más info.', 180],
                    ['out', '¡Hola María! Claro, contame qué producto te interesa.', 175],
                    ['in', 'El plan Pro mensual, ¿incluye soporte?', 160],
                    ['out', 'Sí, soporte 24/7 por WhatsApp y email.', 155],
                    ['in', 'Perfecto, ¿cómo lo contrato?', 90],
                    ['out', 'Te paso el link de pago ahora mismo 👌', 85],
                ],
            ],
            [
                'contact' => ['name' => 'Juan Pérez', 'phone' => '+5491166778899'],
                'messages' => [
                    ['in', 'Buenas, tengo una consulta sobre la factura del mes pasado', 240],
                    ['out', 'Hola Juan, decime qué pasó con la factura.', 235],
                    ['in', 'Me llegó duplicada al email', 230],
                    ['out', 'Lo reviso ahora, dame unos minutos.', 225],
                    ['in', 'Genial, gracias!', 60],
                ],
            ],
            [
                'contact' => ['name' => 'Lucía Fernández', 'phone' => '+5491155667788'],
                'messages' => [
                    ['in', 'Hola, ¿hacen envíos a Córdoba?', 45],
                    ['out', 'Sí Lucía, envíos a todo el país.', 40],
                    ['in', '¿Cuánto tarda?', 30],
                    ['out', 'Entre 3 y 5 días hábiles.', 25],
                    ['in', 'Bárbaro, mañana hago el pedido', 5],
                ],
            ],
        ];

        foreach ($scripts as $script) {
            $contact = Contact::query()
                ->where('tenant_id', $tenant->id)
                ->where('phone', $script['contact']['phone'])
                ->first();

            if (! $contact) {
                $contact = Contact::create([
                    'tenant_id' => $tenant->id,
                    'name' => $script['contact']['name'],
                    'phone' => $script['contact']['phone'],
                    'source' => 'whatsapp',
                ]);
            }

            $existing = Conversation::query()
                ->where('tenant_id', $tenant->id)
                ->where('contact_id', $contact->id)
                ->where('channel_id', $channel->id)
                ->first();

            if ($existing) {
                continue;
            }

            $conversation = Conversation::create([
                'tenant_id' => $tenant->id,
                'channel_id' => $channel->id,
                'contact_id' => $contact->id,
                'assigned_to' => $owner->id,
                'status' => 'open',
            ]);

            $lastAt = null;
            $lastContent = null;

            foreach ($script['messages'] as $msg) {
                [$direction, $content, $minutesAgo] = $msg;
                $createdAt = Carbon::now()->subMinutes($minutesAgo);

                Message::create([
                    'tenant_id' => $tenant->id,
                    'conversation_id' => $conversation->id,
                    'sender_type' => $direction === 'in' ? SenderType::CONTACT : SenderType::USER,
                    'sender_id' => $direction === 'in' ? $contact->id : $owner->id,
                    'content' => $content,
                    'message_type' => MessageType::Text,
                    'direction' => $direction === 'in' ? MessageDirection::INBOUND : MessageDirection::OUTBOUND,
                    'delivered_at' => $createdAt,
                    'read_at' => $direction === 'out' ? $createdAt : null,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);

                $lastAt = $createdAt;
                $lastContent = $content;
            }

            $conversation->update([
                'last_message_at' => $lastAt,
                'last_message_content' => $lastContent,
            ]);
        }

        $this->command?->info('✅ MockChatSeeder: 3 conversaciones con mensajes creadas.');
    }
}
