"use client"

import type React from "react"
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

  if (shouldSkipShell) {
    return <>{children}</>
  }

  // Shell fijo con `position:fixed; inset:0` en vez de `overflow:hidden` en
  // html/body. Motivo: al volver de un diálogo nativo (el selector de archivos
  // del SO), Chrome/macOS dejaba la capa de scroll del root sin repintar y la
  // pantalla quedaba en negro hasta recargar. Ese glitch está atado a tener
  // `html/body { height:100dvh; overflow:hidden }`; al no usarlo, la condición
  // que lo dispara desaparece. El scroll real lo sigue manejando <main>.
  return (
    <div className="fixed inset-0 flex overflow-hidden bg-background">
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
