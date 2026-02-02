"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { Loader2 } from "lucide-react"

// Rutas que no requieren autenticación
const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/pricing", "/email-verified", "/verify-email/confirm"]

// Rutas que solo deben accederse sin autenticación
const authOnlyRoutes = ["/login", "/register", "/forgot-password", "/reset-password"]

// Rutas permitidas sin verificación de email
const unverifiedAllowedRoutes = ["/verify-email", "/email-verified", "/pricing", "/verify-email/confirm"]

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, emailVerified, token, _hasHydrated, setEmailVerified, updateUser } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Esperar a que Zustand se hidrate desde localStorage
    if (!_hasHydrated) {
      return
    }

    const checkAuth = async () => {
      setIsChecking(true)
      
      const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
      const isAuthOnlyRoute = authOnlyRoutes.some(route => pathname.startsWith(route))
      const isUnverifiedAllowed = unverifiedAllowedRoutes.some(route => pathname.startsWith(route))
      
      // Si está autenticado y trata de acceder a login/register, redirigir
      if (isAuthenticated && token && isAuthOnlyRoute) {
        if (emailVerified) {
          router.replace("/chats")
        } else {
          router.replace("/verify-email")
        }
        return
      }
      
      // Si no está autenticado y la ruta no es pública, redirigir a login
      if (!isAuthenticated && !isPublicRoute) {
        router.replace("/login")
        return
      }
      
      // Si hay token, verificar estado del usuario
      if (token && !isPublicRoute) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: { "Authorization": `Bearer ${token}` },
          })
          
          if (!res.ok) {
            // Token inválido, limpiar estado y redirigir
            useAuthStore.getState().logout()
            router.replace("/login")
            return
          }

          const data = await res.json()
          
          // Actualizar estado de verificación de email
          const isVerified = !!data.user?.email_verified_at
          if (isVerified !== emailVerified) {
            setEmailVerified(isVerified)
            updateUser(data.user)
          }

          // Si el email no está verificado y no está en ruta permitida, redirigir
          if (!isVerified && !isUnverifiedAllowed) {
            router.replace("/verify-email")
            return
          }

          // Si el email está verificado y está en verify-email, redirigir a chats
          if (isVerified && pathname === "/verify-email") {
            router.replace("/chats")
            return
          }
        } catch {
          // Error de red, permitir continuar
        }
      }
      
      setIsChecking(false)
    }
    
    checkAuth()
  }, [pathname, isAuthenticated, emailVerified, token, router, _hasHydrated, setEmailVerified, updateUser])

  // Mostrar loader mientras se hidrata o verifica autenticación
  if (!_hasHydrated || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
