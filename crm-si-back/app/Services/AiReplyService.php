<?php

namespace App\Services;

use App\Enums\MessageDirection;
use App\Enums\MessageType;
use App\Models\AiConfig;
use App\Models\Conversation;
use App\Models\Product;
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
     * Regla anti-contaminación de historial. Cuando el tenant actualiza su
     * prompt con la conversación ya empezada, el historial queda lleno de
     * respuestas viejas del bot diciendo "no tengo esa información" y el
     * modelo imita ese patrón en vez de usar el prompt nuevo. Tiene que ir
     * al FINAL del system prompt (después del catálogo): probado en prod,
     * en el medio del prompt no alcanza para revertir el patrón.
     */
    public const HISTORY_OVERRIDE_RULE = 'IMPORTANTE — REGLA FINAL: La información de este system prompt es la '
        .'única fuente de verdad y SIEMPRE prevalece sobre lo dicho antes en la conversación. Si en mensajes '
        .'anteriores respondiste que no tenías o no sabías algún dato (horarios, direcciones, sucursales, '
        .'servicios, productos) que SÍ figura acá arriba, eso fue un error: ignorá esas respuestas y contestá '
        .'ahora con los datos de este prompt.';

    /**
     * Refuerzo de la regla anterior, anexado al último mensaje del cliente.
     * Con muchas negativas viejas acumuladas en el historial, la regla en el
     * system prompt sola no alcanza (probado en prod con ~8 negativas: el
     * modelo seguía imitando su propio patrón). La misma instrucción dentro
     * del turno user sí lo revierte. El cliente de WhatsApp nunca ve esto:
     * solo viaja en el payload a la API.
     */
    public const HISTORY_OVERRIDE_NOTE = '[Nota del sistema: respondé usando la información del system prompt '
        .'vigente, aunque en mensajes anteriores hayas dicho que no la tenías.]';

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

        return $provider->generate($messages, $this->systemPrompt($config, $conversation->tenant_id), $model);
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

        // Solo hay riesgo de contaminación si el bot ya habló en el historial.
        $hasAssistantTurns = collect($messages)->contains(fn ($m) => $m['role'] === 'assistant');

        if ($hasAssistantTurns) {
            $messages[count($messages) - 1]['content'] .= "\n\n".self::HISTORY_OVERRIDE_NOTE;
        }

        return $messages;
    }

    private function systemPrompt(AiConfig $config, int $tenantId): string
    {
        $base = trim($config->system_prompt ?: self::DEFAULT_SYSTEM_PROMPT);

        $catalog = $this->catalogSection($tenantId);

        $prompt = $catalog === '' ? $base : $base."\n\n".$catalog;

        return $prompt."\n\n".self::HISTORY_OVERRIDE_RULE;
    }

    /**
     * Sección de catálogo con los productos activos del tenant, para anexar al
     * system prompt. Corre sin Auth (dentro del job de cola), por lo que hay que
     * saltear el TenantScope y filtrar el tenant a mano. Devuelve '' si no hay
     * productos, para no alterar el prompt actual.
     */
    private function catalogSection(int $tenantId): string
    {
        $maxProducts = (int) config('services.ai.catalog_max_products', 100);
        $maxDescription = (int) config('services.ai.catalog_max_description_chars', 300);
        $maxChars = (int) config('services.ai.catalog_max_chars', 12000);

        // Cargamos uno más que el tope para saber si hubo recorte, sin traer el
        // catálogo entero: un catálogo enorme reventaría el contexto del proveedor
        // y haría que generate() devuelva null para todo el tenant.
        $products = Product::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('name')
            ->limit($maxProducts + 1)
            ->get();

        if ($products->isEmpty()) {
            return '';
        }

        $truncated = $products->count() > $maxProducts;
        $products = $products->take($maxProducts);

        $header = "## Catálogo de productos\n"
            .'Usá únicamente estos datos para responder sobre productos y precios. '
            ."No inventes productos ni precios que no estén en esta lista.\n";

        // Presupuesto de caracteres para las líneas (además del tope por producto).
        $budget = max(0, $maxChars - mb_strlen($header));
        $lines = [];

        foreach ($products as $product) {
            $line = $this->formatCatalogLine($product, $maxDescription);

            // Cortar antes de exceder el presupuesto total de caracteres.
            if (! empty($lines) && mb_strlen(implode("\n", $lines)) + mb_strlen("\n".$line) > $budget) {
                $truncated = true;
                break;
            }

            $lines[] = $line;
        }

        if (empty($lines)) {
            return '';
        }

        $body = implode("\n", $lines);

        if ($truncated) {
            $body .= "\n- (lista parcial: hay más productos disponibles; pedí al cliente que consulte por uno puntual)";
        }

        return $header.$body;
    }

    private function formatCatalogLine(Product $product, int $maxDescription): string
    {
        $parts = [$product->name];

        if ($product->price !== null) {
            $parts[] = '$'.number_format((float) $product->price, 2);
        }

        if (filled($product->description)) {
            $description = trim($product->description);

            if (mb_strlen($description) > $maxDescription) {
                $description = mb_substr($description, 0, $maxDescription).'…';
            }

            $parts[] = $description;
        }

        return '- '.implode(' — ', $parts);
    }
}
