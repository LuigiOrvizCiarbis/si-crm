<?php

namespace App\Services;

/**
 * Se lanza cuando la store_url de WooCommerce no es una URL pública válida
 * (esquema no http/https, puerto no estándar, o resuelve a una IP privada/
 * loopback/link-local). Protege contra SSRF: la URL la controla el tenant.
 */
class WooCommerceUrlException extends \RuntimeException {}
