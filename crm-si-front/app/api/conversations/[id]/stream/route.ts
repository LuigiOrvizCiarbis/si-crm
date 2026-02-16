import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const auth = request.headers.get("authorization");
  const headerToken = auth?.replace("Bearer ", "");
  const queryToken = searchParams.get("token");
  const token = headerToken || queryToken;
  const lastId = searchParams.get("last_id") || "0";

  if (!token) {
    return new NextResponse(JSON.stringify({ error: "Token required" }), { status: 401 });
  }

  // Lista de posibles URLs del backend
  const candidateUrls = [
    process.env.API_INTERNAL_URL,
    "http://host.docker.internal:8000", // Docker Desktop (Mac/Windows)
    "http://127.0.0.1:8000",            // Local IP
    "http://localhost:8000",            // Localhost
    "http://app:80"                     // Docker Network
  ].filter((url): url is string => !!url);

  const uniqueUrls = [...new Set(candidateUrls)];
  
  let lastError = null;

  // Intentar conectar con cada URL hasta tener éxito
  for (const baseUrl of uniqueUrls) {
    const targetUrl = `${baseUrl}/api/conversations/${id}/stream?last_id=${lastId}`;
    
    try {
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "Accept": "text/event-stream",
          "Authorization": `Bearer ${token}`,
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
        cache: "no-store",
        // @ts-ignore - Necesario para streaming en Node.js
        duplex: 'half', 
      });

      if (response.ok) {
        // console.log(`✅ Proxy SSE: Conectado a ${baseUrl}`);
        return new NextResponse(response.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      }
    } catch (error: any) {
      lastError = error;
    }
  }

  return new NextResponse(JSON.stringify({ 
    error: "Backend connection failed", 
    details: lastError?.message 
  }), { status: 502 });
}