import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get("page") || "1";

  // Obtener el token del header de la solicitud original
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json(
      { error: "Authorization header required" },
      { status: 401 }
    );
  }

  // Lista de posibles URLs del backend (Misma lógica robusta que usamos en el stream)
  const candidateUrls = [
    process.env.API_INTERNAL_URL,
    "http://host.docker.internal:8000", // Docker Desktop
    "http://127.0.0.1:8000", // Local IP
    "http://localhost:8000", // Localhost
    "http://app:80", // Docker Network
  ].filter((url): url is string => !!url);

  const uniqueUrls = [...new Set(candidateUrls)];
  let lastError = null;

  for (const baseUrl of uniqueUrls) {
    const targetUrl = `${baseUrl}/api/conversations/${id}/messages?page=${page}`;

    try {
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (error: any) {
      lastError = error;
      // console.warn(`⚠️ Proxy Messages: Falló conexión a ${baseUrl}`);
    }
  }

  return NextResponse.json(
    {
      error: "Backend connection failed",

      details: lastError?.message,
    },
    {
      status: 502,
    }
  );
}
