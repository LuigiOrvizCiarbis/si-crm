<?php

namespace App\Services;

use App\Enums\MessageDirection;
use App\Enums\MessageType;
use App\Models\AiConfig;
use App\Models\Conversation;
use App\Services\Ai\AiProviderFactory;

/**
 * Genera respuestas automáticas de IA para conversaciones entrantes.
 *
 * Arma el historial multi-turno desde la tabla messages del CRM
 * (INBOUND => role user, OUTBOUND => role assistant) y delega la llamada al
 * driver del proveedor configurado por el tenant (Claude, OpenAI, etc.).
 */
class AiReplyService
{
    public const DEFAULT_SYSTEM_PROMPT = 'Sos un asistente de atención al cliente que responde mensajes de WhatsApp '
        .'en nombre de la empresa. Respondé en el mismo idioma del cliente, de forma breve, cordial y útil. '
        .'Si no sabés algo o el cliente pide hablar con una persona, indicá que un agente humano lo va a contactar. '
        .'Nunca inventes precios, promociones ni datos de la empresa.';

    /**
     * Genera el texto de respuesta para la conversación usando el proveedor
     * configurado por el tenant, o null si no se pudo. Nunca lanza: los drivers
     * loguean y devuelven null para no romper el flujo.
     */
    public function respond(Conversation $conversation, AiConfig $config): ?string
    {
        $messages = $this->buildHistory($conversation);

        if (empty($messages)) {
            return null;
        }

        $provider = AiProviderFactory::make($config);

        if (! $provider) {
            return null;
        }

        $model = $config->model ?: $config->provider->defaultModel();

        return $provider->generate($messages, $this->systemPrompt($config), $model);
    }

    /**
     * Últimos N mensajes de texto en orden cronológico, mapeados a roles de la API.
     * La API exige que el primer mensaje sea "user" y no acepta contenidos vacíos.
     *
     * @return array<int, array{role: string, content: string}>
     */
    private function buildHistory(Conversation $conversation): array
    {
        $maxHistory = (int) config('services.ai.max_history', 20);

        $recent = $conversation->messages()
            ->where('message_type', MessageType::Text)
            ->whereNotNull('content')
            ->where('content', '!=', '')
            ->orderByDesc('created_at')
            ->limit($maxHistory)
            ->get()
            ->reverse();

        $messages = [];
        foreach ($recent as $message) {
            $role = $message->direction === MessageDirection::INBOUND ? 'user' : 'assistant';
            $messages[] = ['role' => $role, 'content' => $message->content];
        }

        // El primer mensaje debe ser del usuario: recortar turnos assistant iniciales.
        while (! empty($messages) && $messages[0]['role'] !== 'user') {
            array_shift($messages);
        }

        // Si el último turno no es del contacto no hay nada nuevo que responder.
        if (empty($messages) || end($messages)['role'] !== 'user') {
            return [];
        }

        return $messages;
    }

    private function systemPrompt(AiConfig $config): string
    {
        return trim($config->system_prompt ?: self::DEFAULT_SYSTEM_PROMPT);
    }
}
