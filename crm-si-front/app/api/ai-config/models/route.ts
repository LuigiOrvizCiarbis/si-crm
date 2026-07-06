import { NextRequest, NextResponse } from "next/server";
import { proxyToLaravel } from "@/lib/api/proxy-helper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json(
      { error: "Authorization header required" },
      { status: 401 }
    );
  }

  try {
    const { data, status } = await proxyToLaravel(
      "/api/ai-config/models",
      authHeader,
      { cache: "no-store", timeoutMs: 12000 }
    );
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json(
      { error: "Backend connection failed" },
      { status: 503 }
    );
  }
}
