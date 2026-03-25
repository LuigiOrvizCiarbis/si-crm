import { NextRequest, NextResponse } from "next/server";
import { proxyToLaravel } from "@/lib/api/proxy-helper";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ message: "No auth" }, { status: 401 });

  const { id } = await params;
  const body = JSON.stringify(await req.json());

  try {
    const { data, status } = await proxyToLaravel(
      `/api/opportunities/${id}/stage`,
      authHeader,
      { method: "PATCH", body }
    );
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ message: "No reachable backend" }, { status: 503 });
  }
}
