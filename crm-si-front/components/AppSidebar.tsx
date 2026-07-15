"use client"

import { useCallback, useState } from "react"
import { CrmSidebar } from "@/components/crm-sidebar"
import { useIsMobile } from "@/hooks/use-mobile"

export function AppSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const isMobile = useIsMobile()

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((isOpen) => !isOpen)
  }, [])

  if (isMobile) {
    return null
  }

  return (
    <>
      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeSidebar} />
      ) : null}

      <div
        className={`
          fixed inset-y-0 left-0 z-50 h-dvh max-h-dvh shrink-0 transform transition-all duration-300 ease-in-out lg:static
          ${sidebarOpen ? "translate-x-0 w-60" : "-translate-x-full lg:translate-x-0 lg:w-20"}
        `}
      >
        <CrmSidebar isCollapsed={!sidebarOpen} onToggle={toggleSidebar} />
      </div>
    </>
  )
}
