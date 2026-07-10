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

  const formData = await request.formData();

  try {
    const { data, status } = await proxyToLaravel(
      `/api/channels/${id}/media`,
      authHeader,
      { method: "POST", body: formData, rawBody: true }
    );
    return NextResponse.json(data, { status });
  } catch (error: any) {
    console.error("[Proxy] POST /channels/media failed:", error.message);
    return NextResponse.json({ error: "Backend connection failed" }, { status: 502 });
  }
}
