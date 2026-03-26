import { NextRequest, NextResponse } from "next/server"
import { proxyToLaravel } from "@/lib/api/proxy-helper"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization") || ""
    const body = await request.json()

    const { data, status } = await proxyToLaravel("/api/email/change", authHeader, {
      method: "POST",
      body: JSON.stringify(body),
    })

    return NextResponse.json(data, { status })
  } catch (error: any) {
    console.error("[Auth Change Email Error]:", error)
    return NextResponse.json(
      { message: "Error al conectar con el servidor" },
      { status: 500 }
    )
  }
}
