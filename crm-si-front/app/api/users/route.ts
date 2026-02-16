import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const token = auth?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Authorization token missing" }, { status: 401 });
  }

  const candidateUrls = [
    process.env.API_INTERNAL_URL,
    "http://host.docker.internal:8000",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://app:80"
  ].filter((url): url is string => !!url);

  const uniqueUrls = [...new Set(candidateUrls)];

  for (const baseUrl of uniqueUrls) {
    try {
      const response = await fetch(`${baseUrl}/api/users`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        },
        cache: 'no-store'
      });
      // Nota: este log aparece en el servidor (no en el navegador)
      console.log("[proxy:/api/users]", baseUrl, response.status);

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // intentar siguiente URL
    }
  }

  return NextResponse.json({ error: 'Backend connection failed' }, { status: 502 });
}
