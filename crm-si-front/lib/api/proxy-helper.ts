/**
 * Helper para API routes que actúan como proxy al backend Laravel.
 * Sigue el patrón multi-URL del proyecto para funcionar en Docker y local.
 */
export async function proxyToLaravel(
  endpoint: string,
  authHeader: string,
  options: RequestInit = {}
) {
  const stripSlash = (url?: string) => (url || "").replace(/\/$/, "");
  
  const bases = [
    stripSlash(process.env.API_INTERNAL_URL),       // Env: producción o local
    "http://host.docker.internal:8000",             // Docker fallback
    "http://localhost:8000",                        // Local fallback
  ].filter(Boolean);

  const tried: string[] = [];

  for (const base of bases) {
    const url = `${base}${endpoint}`;
    tried.push(url);

    try {
      
      const res = await fetch(url, {
        ...options,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": authHeader,
          ...options.headers,
        },
      });

      const data = await res.json().catch(() => ({}));

      // Retornar si es exitoso o error cliente (400-499)
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        return { data, status: res.status };
      }

    } catch (err: any) {
      console.warn(`[Proxy] Failed ${base}:`, err.message);
      continue;
    }
  }

  throw new Error(`No reachable backend found. Tried: ${tried.join(", ")}`);
}