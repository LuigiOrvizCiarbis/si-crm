<?php

namespace App\Services\Ai;

/**
 * Resultado de verificar la config de IA de un tenant contra el proveedor.
 *
 * Encapsula si la key funciona, cuántos tokens ocupa el system prompt (para
 * saber si supera el mínimo de prompt caching) y, ante un fallo, un código
 * legible + mensaje para mostrar en la UI en vez del null silencioso que
 * devuelve generate().
 */
class AiVerificationResult
{
    /**
     * @param  bool  $ok  La key es válida y el proveedor respondió.
     * @param  int|null  $promptTokens  Tokens del system prompt, si se pudo medir.
     * @param  string|null  $errorCode  Código legible: invalid_key | no_credit | rate_limit | unknown.
     * @param  string|null  $errorMessage  Detalle crudo del proveedor (para log/tooltip).
     */
    private function __construct(
        public readonly bool $ok,
        public readonly ?int $promptTokens = null,
        public readonly ?string $errorCode = null,
        public readonly ?string $errorMessage = null,
    ) {}

    public static function ok(?int $promptTokens = null): self
    {
        return new self(true, $promptTokens);
    }

    public static function failure(string $errorCode, ?string $errorMessage = null, ?int $promptTokens = null): self
    {
        return new self(false, $promptTokens, $errorCode, $errorMessage);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'ok' => $this->ok,
            'prompt_tokens' => $this->promptTokens,
            'error_code' => $this->errorCode,
            'error_message' => $this->errorMessage,
        ];
    }
}
