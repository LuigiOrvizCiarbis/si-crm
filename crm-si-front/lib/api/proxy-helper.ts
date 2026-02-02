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
  
  // ✅ Solo URLs del backend Laravel (siguiendo instrucciones del proyecto)
  const bases = [
   /*  stripSlash(process.env.API_INTERNAL_URL),      // Docker: http://host.docker.internal:8000
    stripSlash(process.env.LARAVEL_API_URL),       // Local: https://localhost:8443
    "http://localhost:8000",                        // Fallback HTTP
    "https://localhost:8443",   */                     // Fallback HTTPS
    "http://host.docker.internal:8000",             // Docker fallback
  ].filter(Boolean);

  const tried: string[] = [];

  for (const base of bases) {
    const url = `${base}${endpoint}`;
    tried.push(url);

    try {
      console.log(`[Proxy] Trying: ${url}`);
      
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
        console.log(`[Proxy] Success from ${base}`);
        return { data, status: res.status };
      }

    } catch (err: any) {
      console.warn(`[Proxy] Failed ${base}:`, err.message);
      continue;
    }
  }

  throw new Error(`No reachable backend found. Tried: ${tried.join(", ")}`);
}