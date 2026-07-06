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

  const search = request.nextUrl.searchParams.toString();
  const qs = search ? `?${search}` : "";

  try {
    const { data, status } = await proxyToLaravel(
      `/api/dashboard/metrics${qs}`,
      authHeader,
      { cache: "no-store" }
    );
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json(
      { error: "No reachable backend" },
      { status: 503 }
    );
  }
}
