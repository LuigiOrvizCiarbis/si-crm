import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const auth = request.headers.get("authorization");
  const headerToken = auth?.replace("Bearer ", "");
  const queryToken = searchParams.get("token");
  const token = headerToken || queryToken;

  if (!token) {
    return new NextResponse(JSON.stringify({ error: "Token required" }), { status: 401 });
  }

  const candidateUrls = [
    process.env.API_INTERNAL_URL,
    "http://host.docker.internal:8000",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://app:80"
  ].filter((url): url is string => !!url);

  const uniqueUrls = [...new Set(candidateUrls)];
  let lastError = null;

  for (const baseUrl of uniqueUrls) {
    const targetUrl = `${baseUrl}/api/tenant/stream`;

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
        // @ts-ignore
        duplex: 'half',
      });

      if (response.ok) {
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
