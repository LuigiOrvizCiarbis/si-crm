import { NextRequest, NextResponse } from "next/server";
import { proxyToLaravel } from "@/lib/api/proxy-helper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader) return NextResponse.json({ error: "Authorization header required" }, { status: 401 });
  try {
    const query = request.nextUrl.search;
    const { data, status } = await proxyToLaravel(`/api/channels/${id}/templates${query}`, authHeader);
    return NextResponse.json(data, { status });
  } catch (error: any) {
    console.error("[Proxy] GET /channels/templates failed:", error.message);
    return NextResponse.json({ error: "Backend connection failed" }, { status: 502 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader) return NextResponse.json({ error: "Authorization header required" }, { status: 401 });
  try {
    const body = await request.json();
    const { data, status } = await proxyToLaravel(`/api/channels/${id}/templates`, authHeader, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json", Accept: "application/json" },
    });
    return NextResponse.json(data, { status });
  } catch (error: any) {
    console.error("[Proxy] POST /channels/templates failed:", error.message);
    return NextResponse.json({ error: "Backend connection failed" }, { status: 502 });
  }
}
