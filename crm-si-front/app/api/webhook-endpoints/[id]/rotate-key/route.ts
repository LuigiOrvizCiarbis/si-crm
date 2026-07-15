import { NextRequest, NextResponse } from "next/server"
import { proxyResponse, proxyToLaravel } from "@/lib/api/proxy-helper"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteContext) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader) return NextResponse.json({ message: "No auth" }, { status: 401 })

  const { id } = await params

  try {
    const { data, status } = await proxyToLaravel(
      `/api/webhook-endpoints/${id}/rotate-key`,
      authHeader,
      { method: "POST" },
    )
    return proxyResponse(data, status)
  } catch {
    return NextResponse.json({ message: "No reachable backend" }, { status: 503 })
  }
}
