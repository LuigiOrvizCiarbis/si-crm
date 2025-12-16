"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSelector } from "@/components/language-selector"
import { AccountSwitcher } from "@/components/account-switcher"
import { useLanguage } from "@/lib/language-context"
import { useState, useEffect } from "react"

interface SidebarProps {
  className?: string
  isCollapsed?: boolean
  onToggle?: () => void
}

export function CrmSidebar({ className, isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [openSections, setOpenSections] = useState<string[]>([])

  const toggleSection = (section: string) => {
    if (isCollapsed) return
    setOpenSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  const navItems = [
    {
      href: "/",
      emoji: "📊",
      label: t("panel"),
    },
    {
      href: "/chats",
      emoji: "💬",
      label: t("chats"),
    },
    {
      href: "/contactos",
      emoji: "👥",
      label: t("contacts"),
    },
    {
      href: "/oportunidades",
      emoji: "🎯",
      label: t("pipeline"),
    },
    {
      href: "/tareas",
      emoji: "✅",
      label: t("tasks"),
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
      href: "/plantillas-wa",
      emoji: "📝",
      label: "Plantillas WA",
    },
    {
      href: "/difusiones-wa",
      emoji: "📢",
      label: "Difusiones WA",
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
      label: t("administration"),
    },
    {
      href: "/configuracion",
      emoji: "⚙️",
      label: t("configuration"),
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
      {!isCollapsed && (
        <div className="border-b border-sidebar-border">
          <AccountSwitcher />
        </div>
      )}

      {isCollapsed && (
        <div className="flex items-center justify-center p-3 border-b border-sidebar-border">
          <Button variant="ghost" size="sm" onClick={onToggle} className="p-2 hover:bg-sidebar-accent">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      )}

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
            title={isCollapsed ? t("automation") : undefined}
          >
            <span className="text-base">🚀</span>
            {!isCollapsed && (
              <>
                {t("automation")}
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

      {!isCollapsed && (
        <div className="p-4 border-t border-sidebar-border space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">MVP • V4.7.13</p>
            <div className="flex items-center gap-1">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-xs">SI</div>
            <div>
              <p className="text-xs font-semibold">SI CRM</p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Gestioná tus ventas con IA, Omnicanalidad y Multicuenta
              </p>
            </div>
          </div>
        </div>
      )}

      {isCollapsed && (
        <div className="p-2 border-t border-sidebar-border flex flex-col gap-2 items-center">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      )}
    </div>
  )
}
