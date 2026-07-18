"use client"

import type React from "react"
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/AppSidebar"
import { TrialBanner } from "@/components/TrialBanner"
import { isRouteMatch, routesWithoutAppShell } from "@/lib/routes"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const shouldSkipShell = isRouteMatch(pathname, routesWithoutAppShell)

  useEffect(() => {
    if (shouldSkipShell) return

    const html = document.documentElement
    const body = document.body
    const previousHtmlHeight = html.style.height
    const previousHtmlOverflow = html.style.overflow
    const previousBodyHeight = body.style.height
    const previousBodyOverflow = body.style.overflow

    html.style.height = "100dvh"
    html.style.overflow = "hidden"
    body.style.height = "100dvh"
    body.style.overflow = "hidden"

    return () => {
      html.style.height = previousHtmlHeight
      html.style.overflow = previousHtmlOverflow
      body.style.height = previousBodyHeight
      body.style.overflow = previousBodyOverflow
    }
  }, [shouldSkipShell])

  // Al volver de un diálogo nativo (p. ej. el selector de archivos del SO),
  // Chrome/macOS a veces no repinta la capa de composición y la pantalla queda
  // en negro con `html { height:100dvh; overflow:hidden }`. Forzamos un reflow
  // cuando la ventana recupera foco/visibilidad para invalidar la capa.
  useEffect(() => {
    if (shouldSkipShell) return

    let rafId = 0

    const forceRepaint = () => {
      // Al ocultar la pestaña no hay nada que repintar; evitamos el reflow inútil.
      if (document.visibilityState !== "visible") return

      const html = document.documentElement
      html.style.transform = "translateZ(0)"
      // Leer una propiedad de layout fuerza el reflow síncrono.
      void html.offsetHeight
      rafId = requestAnimationFrame(() => {
        html.style.transform = ""
      })
    }

    window.addEventListener("focus", forceRepaint)
    document.addEventListener("visibilitychange", forceRepaint)

    return () => {
      window.removeEventListener("focus", forceRepaint)
      document.removeEventListener("visibilitychange", forceRepaint)
      // Si desmontamos entre el schedule del rAF y su disparo, el translateZ
      // quedaría pegado en <html>; lo cancelamos.
      cancelAnimationFrame(rafId)
    }
  }, [shouldSkipShell])

  if (shouldSkipShell) {
    return <>{children}</>
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <AppSidebar />

      <div className="flex-1 flex min-h-0 flex-col min-w-0 bg-muted/30">
        <TrialBanner />
        <main className="flex-1 flex min-h-0 flex-col overflow-auto bg-background pb-[max(env(safe-area-inset-bottom),64px)] md:pb-0">
          {children}
        </main>
      </div>
    </div>
  )
}
