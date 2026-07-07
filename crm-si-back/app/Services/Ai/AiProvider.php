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

    /**
     * Verifica que la API key funcione y mide el system prompt.
     *
     * Hace un request real chico contra el proveedor para distinguir key
     * inválida, saldo insuficiente y rate limit (a diferencia de generate(),
     * que devuelve null ante cualquier error). Cuando el proveedor lo permite,
     * también reporta cuántos tokens ocupa el system prompt, para saber si
     * supera el mínimo de prompt caching. Nunca lanza.
     *
     * @param  string  $systemPrompt  System prompt a medir/validar.
     * @param  string  $model  Modelo contra el que probar.
     */
    public function verify(string $systemPrompt, string $model): AiVerificationResult;
}
