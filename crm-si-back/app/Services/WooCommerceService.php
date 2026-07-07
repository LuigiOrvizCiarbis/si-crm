<?php

namespace App\Services;

use App\Models\Product;
use App\Models\WooCommerceConfig;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Conector con la REST API de WooCommerce (wc/v3). Prueba credenciales e importa
 * los productos de la tienda al catálogo local (source='woocommerce'), usando
 * WooCommerce como fuente de verdad (upsert idempotente por external_id).
 */
class WooCommerceService
{
    private const API_PREFIX = '/wp-json/wc/v3';

    private const PER_PAGE = 100;

    private const MAX_PAGES = 100; // Tope de seguridad: hasta 10.000 productos por sync.

    /**
     * Prueba la conexión: pega a /products con page_size=1. Distingue credenciales
     * inválidas (401) de URL/tienda inaccesible.
     *
     * @return array{ok: bool, error_code: ?string, error_message: ?string}
     */
    public function testConnection(string $storeUrl, string $consumerKey, string $consumerSecret): array
    {
        try {
            $response = $this->request($storeUrl, $consumerKey, $consumerSecret)
                ->get('/products', ['per_page' => 1]);
        } catch (WooCommerceUrlException $e) {
            return [
                'ok' => false,
                'error_code' => 'invalid_url',
                'error_message' => $e->getMessage(),
            ];
        } catch (\Throwable $e) {
            return [
                'ok' => false,
                'error_code' => 'unreachable',
                'error_message' => 'No se pudo conectar con la tienda. Revisá la URL.',
            ];
        }

        if ($response->status() === 401) {
            return [
                'ok' => false,
                'error_code' => 'invalid_credentials',
                'error_message' => 'Consumer Key/Secret inválidos o sin permisos de lectura.',
            ];
        }

        if (! $response->successful()) {
            return [
                'ok' => false,
                'error_code' => 'unknown',
                'error_message' => 'La tienda respondió con un error ('.$response->status().').',
            ];
        }

        return ['ok' => true, 'error_code' => null, 'error_message' => null];
    }

    /**
     * Sincroniza todos los productos de la tienda al catálogo del tenant.
     * WooCommerce es la fuente de verdad: crea los nuevos y pisa los existentes
     * (match por source='woocommerce' + external_id). No borra productos manuales
     * ni los que ya no estén en Woo.
     *
     * @return array{created: int, updated: int, total: int}
     *
     * @throws WooCommerceUrlException si la store_url no es una URL pública válida.
     */
    public function syncProducts(WooCommerceConfig $config): array
    {
        $storeUrl = $config->store_url;
        $key = $config->getDecryptedConsumerKey();
        $secret = $config->getDecryptedConsumerSecret();

        if (! $key || ! $secret) {
            return ['created' => 0, 'updated' => 0, 'total' => 0];
        }

        // Falla temprano ante una URL bloqueada, antes de tocar la DB.
        $this->assertPublicUrl($storeUrl);

        $created = 0;
        $updated = 0;
        $total = 0;

        for ($page = 1; $page <= self::MAX_PAGES; $page++) {
            $response = $this->request($storeUrl, $key, $secret)->get('/products', [
                'per_page' => self::PER_PAGE,
                'page' => $page,
                'status' => 'publish',
            ]);

            if (! $response->successful()) {
                Log::warning('WooCommerce sync: página falló', [
                    'tenant_id' => $config->tenant_id,
                    'page' => $page,
                    'status' => $response->status(),
                ]);
                break;
            }

            $items = $response->json();

            if (! is_array($items) || count($items) === 0) {
                break;
            }

            foreach ($items as $item) {
                $result = $this->upsertProduct($config->tenant_id, $item);
                $result === 'created' ? $created++ : $updated++;
                $total++;
            }

            // Si la página vino incompleta, no hay más.
            if (count($items) < self::PER_PAGE) {
                break;
            }
        }

        $config->last_synced_at = Carbon::now();
        $config->save();

        return ['created' => $created, 'updated' => $updated, 'total' => $total];
    }

    /**
     * Inserta o actualiza un producto local a partir de un item de la API de Woo.
     *
     * @param  array<string, mixed>  $item
     * @return 'created'|'updated'
     */
    private function upsertProduct(int $tenantId, array $item): string
    {
        $externalId = (string) ($item['id'] ?? '');

        $product = Product::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('source', 'woocommerce')
            ->where('external_id', $externalId)
            ->first();

        $exists = $product !== null;

        if (! $exists) {
            $product = new Product;
            $product->tenant_id = $tenantId;
            $product->source = 'woocommerce';
            $product->external_id = $externalId;
        }

        $product->name = (string) ($item['name'] ?? 'Sin nombre');
        $product->price = $this->parsePrice($item['price'] ?? null);
        $product->description = $this->cleanDescription($item);
        $product->is_active = ($item['status'] ?? 'publish') === 'publish';
        $product->save();

        return $exists ? 'updated' : 'created';
    }

    private function parsePrice(mixed $price): ?float
    {
        if ($price === null || $price === '') {
            return null;
        }

        return is_numeric($price) ? (float) $price : null;
    }

    /**
     * Toma la descripción corta (o la larga como fallback), le quita el HTML y
     * la normaliza. WooCommerce devuelve HTML en estos campos.
     *
     * @param  array<string, mixed>  $item
     */
    private function cleanDescription(array $item): ?string
    {
        $raw = $item['short_description'] ?? '';
        if (trim((string) $raw) === '') {
            $raw = $item['description'] ?? '';
        }

        $text = trim(Str::of((string) $raw)->stripTags()->squish()->value());

        return $text === '' ? null : $text;
    }

    /**
     * Construye un cliente HTTP autenticado contra la REST API de la tienda.
     *
     * @throws WooCommerceUrlException si la store_url no es una URL pública válida.
     */
    private function request(string $storeUrl, string $consumerKey, string $consumerSecret): \Illuminate\Http\Client\PendingRequest
    {
        // La store_url la controla el tenant → validar contra SSRF antes de pegarle.
        // Devuelve las IPs públicas ya validadas para pinnearlas en la conexión.
        $ips = $this->assertPublicUrl($storeUrl);

        $base = rtrim($storeUrl, '/').self::API_PREFIX;

        $parts = parse_url($storeUrl);
        $host = $parts['host'] ?? '';
        $port = $parts['port'] ?? (($parts['scheme'] ?? 'https') === 'http' ? 80 : 443);

        return Http::withBasicAuth($consumerKey, $consumerSecret)
            ->acceptJson()
            ->timeout(30)
            // Sin redirects automáticos: un 30x podría llevarnos a un host interno
            // que no pasó por assertPublicUrl().
            ->withOptions(['allow_redirects' => false])
            // Pin de la IP validada: cURL conecta exactamente a las IPs que
            // resolvimos y validamos, cerrando la ventana de DNS rebinding entre
            // la validación y la conexión real.
            ->withOptions(['curl' => [
                CURLOPT_RESOLVE => ["{$host}:{$port}:".implode(',', $ips)],
            ]])
            ->baseUrl($base);
    }

    /**
     * Valida que la URL sea pública y segura de contactar (anti-SSRF):
     * esquema http/https, host presente, puerto estándar, y que ninguna de las
     * IPs a las que resuelve el host (A + AAAA) sea loopback, privada o link-local.
     *
     * Devuelve las IPs públicas ya validadas para pinnearlas en la conexión y
     * cerrar la ventana de DNS rebinding.
     *
     * @return list<string> IPs públicas validadas a las que resuelve el host.
     *
     * @throws WooCommerceUrlException
     */
    private function assertPublicUrl(string $storeUrl): array
    {
        $parts = parse_url($storeUrl);

        if ($parts === false || empty($parts['host'])) {
            throw new WooCommerceUrlException('URL de tienda inválida.');
        }

        $scheme = strtolower($parts['scheme'] ?? '');
        if (! in_array($scheme, ['http', 'https'], true)) {
            throw new WooCommerceUrlException('La URL debe usar http o https.');
        }

        // Solo puertos web estándar (o el implícito del esquema).
        if (isset($parts['port']) && ! in_array($parts['port'], [80, 443], true)) {
            throw new WooCommerceUrlException('Puerto no permitido.');
        }

        $host = $parts['host'];

        // Si el host ya es una IP literal, validarla directamente.
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            $this->assertPublicIp($host);

            return [$host];
        }

        // Resolver el hostname (A + AAAA) y rechazar si ALGUNA IP resuelta no es
        // pública (defensa contra DNS que devuelve múltiples registros).
        $ips = $this->resolveHost($host);
        if ($ips === []) {
            throw new WooCommerceUrlException('No se pudo resolver el dominio de la tienda.');
        }

        foreach ($ips as $ip) {
            $this->assertPublicIp($ip);
        }

        return $ips;
    }

    /**
     * Resuelve un hostname a todas sus IPs A (IPv4) y AAAA (IPv6). gethostbynamel()
     * solo devuelve IPv4, así que un target IPv6 quedaba sin validar.
     *
     * @return list<string>
     */
    private function resolveHost(string $host): array
    {
        $ips = [];

        $records = @dns_get_record($host, DNS_A | DNS_AAAA);
        if (is_array($records)) {
            foreach ($records as $record) {
                $ip = $record['ip'] ?? $record['ipv6'] ?? null;
                if ($ip !== null) {
                    $ips[] = $ip;
                }
            }
        }

        // Fallback a IPv4 si dns_get_record no devolvió nada (p. ej. /etc/hosts).
        if ($ips === []) {
            $ipv4 = gethostbynamel($host);
            if (is_array($ipv4)) {
                $ips = $ipv4;
            }
        }

        return array_values(array_unique($ips));
    }

    /**
     * Rechaza IPs no enrutables públicamente (loopback, privadas RFC1918,
     * link-local 169.254/16, etc.). Usa los flags de filter_var.
     *
     * @throws WooCommerceUrlException
     */
    private function assertPublicIp(string $ip): void
    {
        $isPublic = filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        );

        if ($isPublic === false) {
            throw new WooCommerceUrlException('La URL apunta a una dirección no permitida.');
        }
    }
}
