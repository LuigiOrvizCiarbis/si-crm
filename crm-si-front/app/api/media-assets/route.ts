import { NextRequest, NextResponse } from "next/server";
import { proxyToLaravel } from "@/lib/api/proxy-helper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 });
  }

  try {
    const { data, status } = await proxyToLaravel("/api/media-assets", authHeader, { method: "GET" });
    return NextResponse.json(data, { status });
  } catch (error: any) {
    console.error("[Proxy] GET /media-assets failed:", error.message);
    return NextResponse.json({ error: "Backend connection failed" }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 });
  }

  const formData = await request.formData();

  try {
    const { data, status } = await proxyToLaravel("/api/media-assets", authHeader, {
      method: "POST",
      body: formData,
      rawBody: true,
    });
    return NextResponse.json(data, { status });
  } catch (error: any) {
    console.error("[Proxy] POST /media-assets failed:", error.message);
    return NextResponse.json({ error: "Backend connection failed" }, { status: 502 });
  }
}
