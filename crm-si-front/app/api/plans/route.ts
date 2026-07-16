import { NextRequest, NextResponse } from "next/server"
import { proxyToLaravel } from "@/lib/api/proxy-helper"

export async function GET(req: NextRequest) {
  // Endpoint público: el catálogo de planes se muestra también sin sesión.
  const authHeader = req.headers.get("authorization") ?? ""

  try {
    const { data, status } = await proxyToLaravel("/api/plans", authHeader)
    return NextResponse.json(data, { status })
  } catch {
    return NextResponse.json({ message: "No reachable backend" }, { status: 503 })
  }
}
