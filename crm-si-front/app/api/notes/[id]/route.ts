import { NextRequest, NextResponse } from "next/server"
import { proxyResponse, proxyToLaravel } from "@/lib/api/proxy-helper"

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader) return NextResponse.json({ message: "No auth" }, { status: 401 })

  const { id } = await params

  try {
    const { data, status } = await proxyToLaravel(`/api/notes/${id}`, authHeader, {
      method: "DELETE",
    })
    return proxyResponse(data, status)
  } catch {
    return NextResponse.json({ message: "No reachable backend" }, { status: 503 })
  }
}
