import { NextRequest, NextResponse } from "next/server"
import { proxyResponse, proxyToLaravel } from "@/lib/api/proxy-helper"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader) return NextResponse.json({ message: "No auth" }, { status: 401 })

  try {
    const { data, status } = await proxyToLaravel("/api/google-calendar/connection", authHeader, {
      cache: "no-store",
    })
    return proxyResponse(data, status)
  } catch {
    return NextResponse.json({ message: "No reachable backend" }, { status: 503 })
  }
}

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader) return NextResponse.json({ message: "No auth" }, { status: 401 })

  try {
    const { data, status } = await proxyToLaravel("/api/google-calendar/connection", authHeader, {
      method: "DELETE",
    })
    return proxyResponse(data, status)
  } catch {
    return NextResponse.json({ message: "No reachable backend" }, { status: 503 })
  }
}
