"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState, useEffect } from "react"

interface SidebarProps {
  className?: string
  isCollapsed?: boolean
  onToggle?: () => void
}

export function CrmSidebar({ className, isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const [openSections, setOpenSections] = useState<string[]>([])

  const toggleSection = (section: string) => {
    if (isCollapsed) return
    setOpenSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  const navItems = [
    {
      href: "/",
      emoji: "📊",
      label: "Panel",
    },
    {
      href: "/chats",
      emoji: "💬",
      label: "Chats",
    },
    {
      href: "/contactos",
      emoji: "👥",
      label: "Contactos",
    },
    {
      href: "/oportunidades",
      emoji: "🎯",
      label: "Embudo de Ventas",
    },
    {
      href: "/tareas",
      emoji: "✅",
      label: "Tareas",
    },
  ]

  const automationItems = [
    {
      href: "/asistente-ia",
      emoji: "✨",
      label: "Atlas IA",
    },
    {
      href: "/chatbot",
      emoji: "🤖",
      label: "Chatbot IA",
    },
    {
      href: "/remarketing",
      emoji: "📧",
      label: "Remarketing",
    },
    {
      href: "/workflows",
      emoji: "⚡",
      label: "Workflows",
    },
    {
      href: "/asignacion-ia",
      emoji: "🎲",
      label: "Asignación IA",
    },
    {
      href: "/analytics-ia",
      emoji: "📈",
      label: "Analytics IA",
    },
  ]

  const bottomItems = [
    {
      href: "/administracion",
      emoji: "💼",
      label: "Administración",
    },
    {
      href: "/configuracion",
      emoji: "⚙️",
      label: "Configuración",
    },
  ]

  const isAutomationActive = automationItems.some((item) => pathname === item.href)

  useEffect(() => {
    if (isAutomationActive && !isCollapsed) {
      setOpenSections((prev) => (prev.includes("automatizacion") ? prev : [...prev, "automatizacion"]))
    } else if (isCollapsed) {
      setOpenSections([])
    }
  }, [isAutomationActive, isCollapsed])

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-56",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-sidebar-border",
          isCollapsed ? "p-3 justify-center" : "p-6 gap-2",
        )}
      >
        {!isCollapsed && (
          <>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-primary-foreground rounded-sm" />
            </div>
            <div className="flex-1">
              <h1 className="font-bold text-sidebar-foreground">SI CRM</h1>
              <p className="text-xs text-muted-foreground">Tablero principal</p>
            </div>
          </>
        )}
        <Button variant="ghost" size="sm" onClick={onToggle} className="p-2 hover:bg-sidebar-accent">
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-2", isCollapsed ? "p-2" : "p-4")}>
        {/* Main navigation items */}
        {navItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  isCollapsed ? "w-12 h-12 p-0 justify-center" : "w-full justify-start gap-3",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="text-base">{item.emoji}</span>
                {!isCollapsed && item.label}
              </Button>
            </Link>
          )
        })}

        {/* Automatización & IA Section */}
        <div>
          <Button
            variant="ghost"
            onClick={() => toggleSection("automatizacion")}
            className={cn(
              isCollapsed ? "w-12 h-12 p-0 justify-center" : "w-full justify-start gap-3",
              isAutomationActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
            title={isCollapsed ? "Automatización & IA" : undefined}
          >
            <span className="text-base">🚀</span>
            {!isCollapsed && (
              <>
                Automatización & IA
                {openSections.includes("automatizacion") ? (
                  <ChevronDown className="w-4 h-4 ml-auto" />
                ) : (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </>
            )}
          </Button>

          {!isCollapsed && openSections.includes("automatizacion") && (
            <div className="ml-4 mt-1 space-y-1">
              {automationItems.map((item) => {
                const isActive = pathname === item.href

                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start gap-3",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <span className="text-sm">{item.emoji}</span>
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Bottom items */}
        {bottomItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  isCollapsed ? "w-12 h-12 p-0 justify-center" : "w-full justify-start gap-3",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="text-base">{item.emoji}</span>
                {!isCollapsed && item.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">MVP • V4.7.0</p>
            <ThemeToggle />
          </div>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>CRM</span>
            <span>Multicuenta</span>
            <span>Omnicanal</span>
            <span>con IA</span>
          </div>
        </div>
      )}

      {isCollapsed && (
        <div className="p-2 border-t border-sidebar-border flex justify-center">
          <ThemeToggle />
        </div>
      )}
    </div>
  )
}
