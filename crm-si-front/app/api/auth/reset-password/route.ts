import { NextRequest, NextResponse } from "next/server"

const BACKEND_URLS = [
  "http://host.docker.internal:8000",
  "http://localhost:8000",
  "https://localhost:8443",
]

async function tryBackendRequest(endpoint: string, options: RequestInit) {
  for (const baseUrl of BACKEND_URLS) {
    const url = `${baseUrl}${endpoint}`
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          ...options.headers,
        },
      })
      
      const data = await res.json().catch(() => ({}))
      
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        return { data, status: res.status }
      }
    } catch (err: any) {
      console.warn(`[Auth] Failed ${baseUrl}:`, err.message)
      continue
    }
  }
  
  throw new Error("No reachable backend found")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { data, status } = await tryBackendRequest("/api/reset-password", {
      method: "POST",
      body: JSON.stringify(body),
    })
    
    return NextResponse.json(data, { status })
  } catch (error: any) {
    console.error("[Auth Reset Password Error]:", error)
    return NextResponse.json(
      { message: "Error al conectar con el servidor" },
      { status: 500 }
    )
  }
}
