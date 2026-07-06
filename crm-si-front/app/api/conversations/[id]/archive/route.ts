import { NextRequest, NextResponse } from "next/server";
import { proxyToLaravel } from "@/lib/api/proxy-helper";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json(
      { error: "Authorization header required" },
      { status: 401 }
    );
  }

  const body = await request.json();

  try {
    const { data, status } = await proxyToLaravel(
      `/api/conversations/${id}/archive`,
      authHeader,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      }
    );
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json(
      { error: "Backend connection failed" },
      { status: 503 }
    );
  }
}
