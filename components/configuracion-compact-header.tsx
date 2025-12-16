"use client"

import { Settings } from "lucide-react"

export function ConfiguracionCompactHeader() {
  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="h-[75px] px-6 flex items-center gap-3">
        <Settings className="w-5 h-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Configuración</h1>
      </div>
    </div>
  )
}
