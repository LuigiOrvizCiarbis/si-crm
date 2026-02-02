'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'

export default function VerifyEmailConfirmPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setEmailVerified } = useAuthStore()
  
  const [status, setStatus] = useState<'loading' | 'success' | 'already' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const hasVerified = useRef(false)

  useEffect(() => {
    // Prevenir doble ejecución en React Strict Mode
    if (hasVerified.current) return
    hasVerified.current = true

    const verifyEmail = async () => {
      const id = searchParams.get('id')
      const hash = searchParams.get('hash')
      const expires = searchParams.get('expires')
      const signature = searchParams.get('signature')

      if (!id || !hash || !expires || !signature) {
        setStatus('error')
        setErrorMessage('Enlace de verificación inválido. Faltan parámetros.')
        return
      }

      try {
        const response = await fetch(`/api/auth/verify-email?id=${id}&hash=${hash}&expires=${expires}&signature=${signature}`)
        const data = await response.json()
        
        console.log('Verify response:', { status: response.status, data })

        if (response.ok) {
          // El backend devuelve { success: true } para verificación exitosa
          // y { already: true } si ya estaba verificado
          if (data.success) {
            setStatus('success')
            setEmailVerified(true)
          } else if (data.already) {
            setStatus('already')
            setEmailVerified(true)
          } else {
            // Fallback: si response.ok pero no hay flags, asumir éxito
            setStatus('success')
            setEmailVerified(true)
          }
        } else {
          setStatus('error')
          setErrorMessage(data.message || 'Error al verificar el email')
        }
      } catch {
        setStatus('error')
        setErrorMessage('Error de conexión. Por favor intenta de nuevo.')
      }
    }

    verifyEmail()
  }, [searchParams, setEmailVerified])

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto mb-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <CardTitle>Verificando tu email...</CardTitle>
              <CardDescription>
                Por favor espera mientras confirmamos tu dirección de correo.
              </CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle className="text-green-600">¡Email verificado!</CardTitle>
              <CardDescription>
                Tu cuenta ha sido verificada exitosamente. Ya puedes acceder a todas las funcionalidades.
              </CardDescription>
            </>
          )}

          {status === 'already' && (
            <>
              <div className="mx-auto mb-4">
                <AlertCircle className="h-12 w-12 text-blue-500" />
              </div>
              <CardTitle className="text-blue-600">Email ya verificado</CardTitle>
              <CardDescription>
                Tu dirección de correo ya había sido verificada anteriormente.
              </CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-red-600">Error de verificación</CardTitle>
              <CardDescription className="text-red-500">
                {errorMessage}
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {(status === 'success' || status === 'already') && (
            <Button className="w-full" onClick={() => router.push('/login')}>
              Iniciar sesión
            </Button>
          )}

          {status === 'error' && (
            <div className="space-y-2">
              <Button className="w-full" variant="outline" asChild>
                <Link href="/verify-email">
                  Solicitar nuevo enlace
                </Link>
              </Button>
              <Button className="w-full" variant="ghost" asChild>
                <Link href="/login">
                  Volver al login
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
