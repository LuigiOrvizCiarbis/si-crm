/**
 * Helper para API routes que actúan como proxy al backend Laravel.
 * Sigue el patrón multi-URL del proyecto para funcionar en Docker y local.
 */
export async function proxyToLaravel(
  endpoint: string,
  authHeader: string,
  options: RequestInit & { rawBody?: boolean } = {}
) {
  const stripSlash = (url?: string) => (url || "").replace(/\/$/, "");
  const method = (options.method || "GET").toUpperCase();
  const isRetryableMethod = method === "GET" || method === "HEAD" || method === "OPTIONS";
  
  const bases = [
    stripSlash(process.env.API_INTERNAL_URL),       // Env: producción o local
    "http://host.docker.internal:8000",             // Docker fallback
    "http://localhost:8000",                        // Local fallback
  ].filter(Boolean);

  const { rawBody, ...fetchOptions } = options;
  const tried: string[] = [];

  for (const base of bases) {
    const url = `${base}${endpoint}`;
    tried.push(url);

    try {
      const defaultHeaders: Record<string, string> = {
        "Accept": "application/json",
        "Authorization": authHeader,
      };
      if (!rawBody) {
        defaultHeaders["Content-Type"] = "application/json";
      }

      const res = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...defaultHeaders,
          ...fetchOptions.headers,
        },
      });

      const data = await res.json().catch(() => ({}));

      // Retornar si es exitoso o error cliente (400-499)
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        return { data, status: res.status };
      }

      // No reintentar mutaciones: evita duplicar escrituras cuando el backend
      // creó el recurso pero falló en un paso posterior (por ejemplo, email).
      if (!isRetryableMethod) {
        return { data, status: res.status };
      }

      // 5xx: intentar siguiente backend para métodos idempotentes
      console.warn(`[Proxy] 5xx from ${base}: ${res.status}`);
      continue;

    } catch (err: any) {
      if (!isRetryableMethod) {
        throw err;
      }

      console.warn(`[Proxy] Failed ${base}:`, err.message);
      continue;
    }
  }

  // Todos los backends fallaron o devolvieron 5xx: mensaje genérico
  return {
    data: { message: "Ocurrió un error interno. Inténtalo de nuevo más tarde." },
    status: 502,
  };
}
