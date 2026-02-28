import { NextRequest, NextResponse } from "next/server";
import { proxyToLaravel } from "@/lib/api/proxy-helper";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = request.headers.get("authorization") || "";

  if (!authHeader) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { data, status } = await proxyToLaravel(
      `/api/conversations/${id}/send-template`,
      authHeader,
      { method: "POST", body: JSON.stringify(body) }
    );
    return NextResponse.json(data, { status });
  } catch (error: any) {
    console.error("[Proxy] POST /conversations/send-template failed:", error.message);
    return NextResponse.json({ error: "Backend connection failed" }, { status: 502 });
  }
}
