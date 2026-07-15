import { NextRequest, NextResponse } from "next/server"
import { proxyToLaravel } from "@/lib/api/proxy-helper"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string; deliveryId: string }> }

export async function GET(req: NextRequest, { params }: RouteContext) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader) return NextResponse.json({ message: "No auth" }, { status: 401 })

  const { id, deliveryId } = await params

  try {
    const { data, status } = await proxyToLaravel(
      `/api/webhook-endpoints/${id}/deliveries/${deliveryId}`,
      authHeader,
      { cache: "no-store" },
    )
    return NextResponse.json(data, { status })
  } catch {
    return NextResponse.json({ message: "No reachable backend" }, { status: 503 })
  }
}
