import { NextRequest, NextResponse } from 'next/server'

const API_URLS = [
  process.env.API_INTERNAL_URL,
  process.env.NEXT_PUBLIC_API_URL,
  'http://host.docker.internal:8000',
  'http://localhost:8000',
].filter(Boolean) as string[]

async function tryFetch(path: string): Promise<Response | null> {
  for (const baseUrl of API_URLS) {
    try {
      const url = `${baseUrl}${path}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })
      return response
    } catch {
      continue
    }
  }
  return null
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')
  const hash = searchParams.get('hash')
  const expires = searchParams.get('expires')
  const signature = searchParams.get('signature')

  if (!id || !hash || !expires || !signature) {
    return NextResponse.json(
      { message: 'Parámetros de verificación faltantes' },
      { status: 400 }
    )
  }

  const path = `/api/email/verify/${id}/${hash}?expires=${expires}&signature=${signature}`
  
  const response = await tryFetch(path)
  
  if (!response) {
    return NextResponse.json(
      { message: 'No se pudo conectar al servidor' },
      { status: 503 }
    )
  }

  // Leer la respuesta JSON del backend
  try {
    const data = await response.json()
    
    // Devolver exactamente lo que el backend envía
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json(
      { message: 'Error al procesar la respuesta' },
      { status: 500 }
    )
  }
}
