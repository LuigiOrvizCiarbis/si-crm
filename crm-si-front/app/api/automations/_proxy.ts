import { NextRequest, NextResponse } from "next/server"
import { proxyResponse, proxyToLaravel } from "@/lib/api/proxy-helper"

export async function forwardAutomation(
  request: NextRequest,
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
) {
  const authorization = request.headers.get("authorization")
  if (!authorization) {
    return NextResponse.json({ message: "Authorization header required" }, { status: 401 })
  }

  try {
    const body = method === "GET" || method === "DELETE" ? undefined : await request.text()
    const { data, status } = await proxyToLaravel(endpoint, authorization, {
      method,
      body: body || undefined,
      cache: "no-store",
      observability: { feature: "automations", action: method.toLowerCase() },
    })
    return proxyResponse(data, status)
  } catch {
    return NextResponse.json({ message: "Backend connection failed" }, { status: 503 })
  }
}
