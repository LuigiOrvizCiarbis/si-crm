<?php

namespace App\Services\Ai\Providers;

use Anthropic\Client;
use App\Services\Ai\AiProvider;
use GuzzleHttp\Client as GuzzleClient;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Driver de Claude (Anthropic) vía SDK oficial. El system prompt se manda
 * como bloque con cache_control ephemeral para aprovechar prompt caching.
 */
class AnthropicProvider implements AiProvider
{
    public function __construct(private string $apiKey) {}

    public function generate(array $messages, string $systemPrompt, string $model): ?string
    {
        try {
            $client = new Client(
                apiKey: $this->apiKey,
                requestOptions: [
                    'transporter' => new GuzzleClient(['timeout' => 10]),
                ],
            );

            $response = $client->messages->create(
                model: $model,
                maxTokens: 1024,
                system: [
                    [
                        'type' => 'text',
                        'text' => $systemPrompt,
                        'cache_control' => ['type' => 'ephemeral'],
                    ],
                ],
                messages: $messages,
            );

            foreach ($response->content as $block) {
                if ($block->type === 'text' && trim($block->text) !== '') {
                    return trim($block->text);
                }
            }

            Log::warning('AnthropicProvider: respuesta sin bloque de texto', [
                'stop_reason' => $response->stopReason,
            ]);

            return null;
        } catch (\Throwable $e) {
            Log::error('AnthropicProvider: error generando respuesta', [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    public function listModels(): array
    {
        try {
            $response = Http::withHeaders([
                'x-api-key' => $this->apiKey,
                'anthropic-version' => '2023-06-01',
            ])
                ->timeout(10)
                ->get('https://api.anthropic.com/v1/models', ['limit' => 100]);

            if (! $response->successful()) {
                Log::warning('AnthropicProvider: listModels no exitoso', [
                    'status' => $response->status(),
                ]);

                return [];
            }

            $ids = array_column($response->json('data', []), 'id');
            sort($ids);

            return array_values($ids);
        } catch (\Throwable $e) {
            Log::error('AnthropicProvider: error listando modelos', [
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }
}
