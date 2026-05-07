import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const token = auth?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.toString();
  const qs = search ? `?${search}` : "";

  const candidateUrls = [
    process.env.API_INTERNAL_URL,
    "http://host.docker.internal:8000",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://app:80",
  ].filter((url): url is string => !!url);

  const uniqueUrls = [...new Set(candidateUrls)];

  for (const baseUrl of uniqueUrls) {
    try {
      const response = await fetch(`${baseUrl}/api/dashboard/metrics${qs}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return NextResponse.json(data, { status: response.status });
      }
    } catch (error) {
      console.error(`[dashboard/metrics] backend ${baseUrl} failed:`, error);
    }
  }

  return NextResponse.json({ error: "No reachable backend" }, { status: 502 });
}
