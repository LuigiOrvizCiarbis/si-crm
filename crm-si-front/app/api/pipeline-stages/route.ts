import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const token = auth?.replace("Bearer ", "");


  if (!token) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 });
  }

  // Lista de posibles URLs del backend
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
      const response = await fetch(`${baseUrl}/api/pipeline-stages`, {
        method: "GET",
         headers: { Accept: "application/json", 
            Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (error) {
      // Continue to next URL
    }
  }

  return NextResponse.json({ error: "Backend connection failed" }, { status: 502 });
}