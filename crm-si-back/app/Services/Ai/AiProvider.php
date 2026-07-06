<?php

namespace App\Services\Ai;

/**
 * Contrato común de un proveedor de IA (Claude, OpenAI, etc.).
 *
 * Cada driver recibe la API key del tenant por constructor y expone un único
 * método de generación de texto. Nunca debe lanzar: ante cualquier error
 * loguea y devuelve null, para no romper el flujo del auto-responder.
 */
interface AiProvider
{
    /**
     * Genera una respuesta de texto a partir del historial de conversación.
     *
     * @param  array<int, array{role: string, content: string}>  $messages
     *                                                                      Historial en orden cronológico. role ∈ {user, assistant}.
     * @param  string  $systemPrompt  Instrucciones de sistema para el modelo.
     * @param  string  $model  Identificador del modelo del proveedor.
     * @return string|null Texto de la respuesta, o null si no se pudo generar.
     */
    public function generate(array $messages, string $systemPrompt, string $model): ?string;

    /**
     * Lista los modelos de chat disponibles para la API key del tenant.
     *
     * Consulta el endpoint de modelos del proveedor. Nunca lanza: ante cualquier
     * error (key inválida, timeout, etc.) loguea y devuelve un array vacío.
     *
     * @return list<string> IDs de modelo, ordenados alfabéticamente.
     */
    public function listModels(): array;
}
