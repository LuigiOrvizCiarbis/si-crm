<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Se lanza cuando un usuario intenta conectar un número de WhatsApp que ya
 * está conectado por otro miembro del mismo tenant. La reasignación queda
 * fuera de alcance del flujo de auto-onboarding (debe hacerla un admin).
 */
class ChannelAlreadyConnectedException extends RuntimeException
{
    public function __construct(
        public readonly int $tenantId,
        public readonly int $existingUserId,
        public readonly int $requestingUserId,
        public readonly ?string $phoneNumberId,
        string $message = 'Este número de WhatsApp ya está conectado por otro usuario del equipo. Pedile a un administrador que te lo reasigne.',
    ) {
        parent::__construct($message);
    }
}
