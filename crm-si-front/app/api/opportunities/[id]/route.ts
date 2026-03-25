import { NextRequest, NextResponse } from "next/server";
import { proxyToLaravel } from "@/lib/api/proxy-helper";

type RouteContext = { params: Promise<{ id: string }> };

async function proxy(req: NextRequest, { params }: RouteContext, method: string) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ message: "No auth" }, { status: 401 });

  const { id } = await params;
  const body = method === "GET" || method === "DELETE"
    ? undefined
    : JSON.stringify(await req.json());

  try {
    const { data, status } = await proxyToLaravel(
      `/api/opportunities/${id}`,
      authHeader,
      { method, ...(body ? { body } : {}) }
    );
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ message: "No reachable backend" }, { status: 503 });
  }
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  return proxy(req, ctx, "GET");
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  return proxy(req, ctx, "PUT");
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  return proxy(req, ctx, "DELETE");
}
