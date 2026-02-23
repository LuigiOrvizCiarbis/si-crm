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

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    
    if (!authHeader) {
      return NextResponse.json(
        { authenticated: false, message: "No autorizado" },
        { status: 401 }
      )
    }
    
    const { data, status } = await tryBackendRequest("/api/user", {
      method: "GET",
      headers: {
        "Authorization": authHeader,
      },
    })
    
    if (status === 200) {
      return NextResponse.json({ authenticated: true, user: data })
    }
    
    return NextResponse.json(
      { authenticated: false, message: "Sesión inválida" },
      { status: 401 }
    )
  } catch (error: any) {
    console.error("[Auth Me Error]:", error)
    return NextResponse.json(
      { authenticated: false, message: "Error al conectar con el servidor" },
      { status: 500 }
    )
  }
}
