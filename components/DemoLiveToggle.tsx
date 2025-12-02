"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useDashboardStore } from "@/store/useDashboardStore"
import { Sparkles, Database } from "lucide-react"

export function DemoLiveToggle() {
  const { mode, toggleMode } = useDashboardStore()
  const isDemoMode = mode === "demo"

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-border bg-card/50">
      <div className="flex items-center gap-2">
        {isDemoMode ? <Sparkles className="w-4 h-4 text-cyan-500" /> : <Database className="w-4 h-4 text-green-500" />}
        <Label htmlFor="demo-mode" className="text-sm font-medium cursor-pointer">
          Modo {isDemoMode ? "Demo" : "Live"}
        </Label>
      </div>

      <Switch
        id="demo-mode"
        checked={isDemoMode}
        onCheckedChange={toggleMode}
        className="data-[state=checked]:bg-cyan-600"
      />

      {isDemoMode && (
        <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-500">
          Datos generados
        </Badge>
      )}

      {!isDemoMode && (
        <Badge variant="outline" className="text-xs border-green-500/30 text-green-500">
          Datos reales
        </Badge>
      )}
    </div>
  )
}
