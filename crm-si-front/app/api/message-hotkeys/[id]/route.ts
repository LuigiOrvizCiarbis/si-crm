import { NextRequest, NextResponse } from "next/server"
import { proxyToLaravel } from "@/lib/api/proxy-helper"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader) return NextResponse.json({ message: "No auth" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  try {
    const { data, status } = await proxyToLaravel(`/api/message-hotkeys/${id}`, authHeader, {
      method: "PUT",
      body: JSON.stringify(body),
    })
    return NextResponse.json(data, { status })
  } catch {
    return NextResponse.json({ message: "No reachable backend" }, { status: 503 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader) return NextResponse.json({ message: "No auth" }, { status: 401 })

  const { id } = await params

  try {
    const { data, status } = await proxyToLaravel(`/api/message-hotkeys/${id}`, authHeader, {
      method: "DELETE",
    })
    return NextResponse.json(data, { status })
  } catch {
    return NextResponse.json({ message: "No reachable backend" }, { status: 503 })
  }
}
