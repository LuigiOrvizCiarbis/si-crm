"use client"

import { usePathname } from "next/navigation"
import { getRouteConfig } from "@/lib/route-config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NotificationsBell } from "@/components/notifications-bell"
import { Search, Filter, Zap, FileText } from "lucide-react"

export function GlobalHeader() {
  const pathname = usePathname()
  const config = getRouteConfig(pathname)

  if (!config) return null

  const handleCTAClick = () => {
    const event = new CustomEvent("global-header-cta", {
      detail: { pathname, ctaLabel: config.ctaLabel },
    })
    window.dispatchEvent(event)
  }

  const handleSecondaryAction = (action: string) => {
    const event = new CustomEvent("global-header-secondary-action", {
      detail: { pathname, action },
    })
    window.dispatchEvent(event)
  }

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case "zap":
        return <Zap className="w-4 h-4" />
      case "file-text":
        return <FileText className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <div className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="px-4 md:px-6 lg:px-8">
        {/* NIVEL 1: Título + Subtítulo (izq) y CTA + Campanita (der) */}
        <div className="flex items-start justify-between py-4 md:py-6 gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{config.title}</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">{config.subtitle}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {config.ctaLabel && (
              <Button size="sm" className="hidden md:flex" onClick={handleCTAClick}>
                {config.ctaLabel}
              </Button>
            )}
            <NotificationsBell />
          </div>
        </div>

        {/* NIVEL 3: Búsqueda + Filtros + Secondary Actions (si aplica) */}
        {(config.showSearch || config.showFilters || config.secondaryActions) && (
          <div className="flex items-center gap-2 pb-4 border-t border-border pt-4">
            {config.showSearch && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={config.searchPlaceholder || "Buscar..."}
                  className="pl-9 h-9"
                  onChange={(e) => {
                    const event = new CustomEvent("global-header-search", {
                      detail: { query: e.target.value, pathname },
                    })
                    window.dispatchEvent(event)
                  }}
                />
              </div>
            )}
            {config.showFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const event = new CustomEvent("global-header-filter", { detail: { pathname } })
                  window.dispatchEvent(event)
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            )}
            {config.secondaryActions?.map((action, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => handleSecondaryAction(action.action)}
                className="gap-2"
              >
                {getIcon(action.icon)}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
