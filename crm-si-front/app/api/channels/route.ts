import { NextRequest, NextResponse } from "next/server";
import { proxyToLaravel } from "@/lib/api/proxy-helper";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json(
      { message: "No authorization token provided" },
      { status: 401 }
    );
  }

  try {
    const { data, status } = await proxyToLaravel("/api/channels", authHeader);
    return NextResponse.json(data, { status });
  } catch (error: any) {
    console.error("[GET /api/channels] Error:", error);
    return NextResponse.json(
      { message: error.message || "Proxy error" },
      { status: 503 }
    );
  }
}