<?php

namespace Database\Factories;

use App\Enums\TemplateCategory;
use App\Enums\TemplateStatus;
use App\Models\Tenant;
use App\Models\WhatsAppConfig;
use App\Models\WhatsAppTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WhatsAppTemplate>
 */
class WhatsAppTemplateFactory extends Factory
{
    protected $model = WhatsAppTemplate::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'whatsapp_config_id' => WhatsAppConfig::factory(),
            'external_id' => $this->faker->unique()->numerify('##########'),
            'name' => $this->faker->slug(2),
            'language' => $this->faker->randomElement(['es_AR', 'en_US', 'pt_BR']),
            'category' => TemplateCategory::Utility,
            'status' => TemplateStatus::Approved,
            'components' => [
                [
                    'type' => 'BODY',
                    'text' => 'Hola {{1}}, tu pedido #{{2}} está listo.',
                    'example' => [
                        'body_text' => [['Juan', '12345']],
                    ],
                ],
            ],
            'synced_at' => now(),
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TemplateStatus::Approved,
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TemplateStatus::Pending,
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TemplateStatus::Rejected,
        ]);
    }
}
