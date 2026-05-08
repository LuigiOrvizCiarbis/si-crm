"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/AppSidebar"
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

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 bg-muted/30">
        <main className="flex-1 flex flex-col overflow-auto bg-background h-full pb-[max(env(safe-area-inset-bottom),64px)] md:pb-0">
          {children}
        </main>
      </div>
    </div>
  )
}
