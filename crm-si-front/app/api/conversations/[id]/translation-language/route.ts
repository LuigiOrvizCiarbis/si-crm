import { NextRequest, NextResponse } from "next/server";
import { proxyResponse, proxyToLaravel } from "@/lib/api/proxy-helper";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ message: "No auth" }, { status: 401 });

  const { id } = await params;
  const body = JSON.stringify(await req.json());
  try {
    const { data, status } = await proxyToLaravel(
      `/api/conversations/${id}/translation-language`,
      authHeader,
      { method: "PATCH", body },
    );
    return proxyResponse(data, status);
  } catch {
    return NextResponse.json({ message: "Backend connection failed" }, { status: 503 });
  }
}
