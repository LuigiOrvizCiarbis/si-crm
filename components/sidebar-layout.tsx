"use client"

import type React from "react"
import { useState } from "react"
import { CrmSidebar } from "./crm-sidebar"
import { GlobalHeader } from "./global-header"
import { useIsMobile } from "@/hooks/use-mobile"

interface SidebarLayoutProps {
  children: React.ReactNode
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const isMobile = useIsMobile()

  return (
    <div className="flex h-screen bg-background">
      {!isMobile && (
        <>
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          {/* Sidebar */}
          <div
            className={`
            fixed lg:static inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0 w-56" : "-translate-x-full lg:translate-x-0 lg:w-16"}
          `}
          >
            <CrmSidebar isCollapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-muted/30">
        <GlobalHeader />

        <main className="flex-1 overflow-auto bg-background min-h-[100svh] pb-[max(env(safe-area-inset-bottom),64px)] md:pb-0">
          {children}
        </main>
      </div>
    </div>
  )
}
