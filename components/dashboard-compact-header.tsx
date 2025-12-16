"use client"

import { NotificationsBell } from "@/components/notifications-bell"
import { LayoutDashboard } from "lucide-react"

export function DashboardCompactHeader() {
  return (
    <div className="sticky top-0 z-40 h-[75px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between h-full px-4 md:px-6 lg:px-8">
        {/* Título */}
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold">Panel</h1>
        </div>

        {/* Campanita */}
        <NotificationsBell />
      </div>
    </div>
  )
}
