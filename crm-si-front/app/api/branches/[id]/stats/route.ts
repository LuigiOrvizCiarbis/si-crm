import { NextRequest, NextResponse } from "next/server"
import { proxyToLaravel } from "@/lib/api/proxy-helper"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader) return NextResponse.json({ message: "No auth" }, { status: 401 })

  const { id } = await params
  const search = req.nextUrl.search || ""

  try {
    const { data, status } = await proxyToLaravel(`/api/branches/${id}/stats${search}`, authHeader)
    return NextResponse.json(data, { status })
  } catch {
    return NextResponse.json({ message: "No reachable backend" }, { status: 503 })
  }
}
