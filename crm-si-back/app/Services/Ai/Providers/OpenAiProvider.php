<?php

namespace App\Services\Ai\Providers;

use App\Services\Ai\AiProvider;
use GuzzleHttp\Client as GuzzleClient;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use OpenAI;

/**
 * Driver de OpenAI (GPT) vía SDK oficial. A diferencia de Claude, el system
 * prompt va como primer mensaje con role "system" dentro de messages.
 */
class OpenAiProvider implements AiProvider
{
    public function __construct(private string $apiKey) {}

    public function generate(array $messages, string $systemPrompt, string $model): ?string
    {
        try {
            $client = OpenAI::factory()
                ->withApiKey($this->apiKey)
                ->withHttpClient(new GuzzleClient(['timeout' => 10]))
                ->make();

            $response = $client->chat()->create([
                'model' => $model,
                'max_tokens' => 1024,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ...$messages,
                ],
            ]);

            $content = $response->choices[0]->message->content ?? null;

            if ($content !== null && trim($content) !== '') {
                return trim($content);
            }

            Log::warning('OpenAiProvider: respuesta sin contenido de texto', [
                'finish_reason' => $response->choices[0]->finishReason ?? null,
            ]);

            return null;
        } catch (\Throwable $e) {
            Log::error('OpenAiProvider: error generando respuesta', [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    public function listModels(): array
    {
        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(10)
                ->get('https://api.openai.com/v1/models');

            if (! $response->successful()) {
                Log::warning('OpenAiProvider: listModels no exitoso', [
                    'status' => $response->status(),
                ]);

                return [];
            }

            // /v1/models trae de todo (embeddings, whisper, tts, dall-e...).
            // Filtramos a modelos que sirven para chat completions.
            $ids = array_filter(
                array_column($response->json('data', []), 'id'),
                fn (string $id) => str_starts_with($id, 'gpt-')
                    || str_starts_with($id, 'chatgpt-')
                    || (bool) preg_match('/^o\d/', $id),
            );

            sort($ids);

            return array_values($ids);
        } catch (\Throwable $e) {
            Log::error('OpenAiProvider: error listando modelos', [
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }
}
