import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const headerAuth = request.headers.get("authorization");
  const incomingToken = headerAuth?.startsWith("Bearer ") ? headerAuth.split(" ")[1] : undefined;
  const token = incomingToken || process.env.NEXT_PUBLIC_TOKEN;

  if (!token) {
    return NextResponse.json({ error: "Authorization token missing" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

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
      const response = await fetch(`${baseUrl}/api/conversations/${id}/users/add`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body),
        cache: 'no-store'
      });

      console.log(`[proxy:/api/conversations/${id}/users/add]`, baseUrl, response.status);

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }

      // Si hay error específico del backend, devolverlo
      if (response.status >= 400 && response.status < 500) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(errorData, { status: response.status });
      }
    } catch (e) {
      // intentar siguiente URL
    }
  }

  return NextResponse.json({ error: 'Backend connection failed' }, { status: 502 });
}
