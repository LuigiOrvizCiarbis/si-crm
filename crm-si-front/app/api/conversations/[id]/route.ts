import { NextRequest, NextResponse } from "next/server";
import { proxyToLaravel } from "@/lib/api/proxy-helper";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { message: "Invalid or missing authorization token" },
      { status: 401 }
    );
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { message: "Conversation ID is required" },
      { status: 400 }
    );
  }

  try {
    // ✅ Usar el helper que ya excluye NEXT_PUBLIC_API_URL
    const { data, status } = await proxyToLaravel(
      `/api/conversations/${id}`,
      authHeader
    );

    return NextResponse.json(data, { status });
  } catch (error: any) {
    console.error(`[GET /api/conversations/${id}] Error:`, error.message);

    return NextResponse.json(
      { message: error.message || "No reachable backend" },
      { status: 503 }
    );
  }
}
