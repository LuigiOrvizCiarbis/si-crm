import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = process.env.NEXT_PUBLIC_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "Authorization header required" },
      { status: 401 }
    );
  }

  const body = await request.json();

  // Lista de posibles URLs del backend
  const candidateUrls = [
    process.env.API_INTERNAL_URL,
    "http://host.docker.internal:8000",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://app:80",
  ].filter((url): url is string => !!url);

  const uniqueUrls = [...new Set(candidateUrls)];

  const errors: any[] = [];

  for (const baseUrl of uniqueUrls) {
    try {
      const response = await fetch(`${baseUrl}/api/conversations/${id}/stage`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok || response.status >= 400) {
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: response.status });
      }
    } catch (error: any) {
      // Continue to next URL
      console.error(`[PROXY] Connection to ${baseUrl} failed:`, error);
      errors.push({ url: baseUrl, error: error.message });
    }
  }

  return NextResponse.json(
    { error: "Backend connection failed", details: errors },
    { status: 502 }
  );
}
