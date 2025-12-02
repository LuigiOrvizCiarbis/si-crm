"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Users, Target, CheckSquare, BarChart3, Menu, Settings, HelpCircle, Shield } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

interface MobileBottomNavProps {
  className?: string
}

export function MobileBottomNav({ className }: MobileBottomNavProps) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Mock counters - in real app these would come from store/context
  const unreadChats = 3
  const pendingTasks = 5

  const mainNavItems = [
    {
      href: "/",
      icon: BarChart3,
      label: "Panel",
      isActive: pathname === "/",
    },
    {
      href: "/chats",
      icon: MessageSquare,
      label: "Chats",
      isActive: pathname === "/chats",
      badge: unreadChats > 0 ? unreadChats : undefined,
    },
    {
      href: "/contactos",
      icon: Users,
      label: "Contactos",
      isActive: pathname === "/contactos",
    },
    {
      href: "/oportunidades",
      icon: Target,
      label: "Pipeline",
      isActive: pathname === "/oportunidades",
    },
    {
      href: "/tareas",
      icon: CheckSquare,
      label: "Tareas",
      isActive: pathname === "/tareas",
      badge: pendingTasks > 0 ? pendingTasks : undefined,
    },
  ]

  const menuItems = [
    {
      href: "/metricas",
      icon: BarChart3,
      label: "Métricas",
    },
    {
      href: "/admin",
      icon: Shield,
      label: "Admin",
    },
    {
      href: "/configuracion",
      icon: Settings,
      label: "Configuración",
    },
    {
      href: "#",
      icon: HelpCircle,
      label: "Ayuda",
      onClick: () => {
        // Dummy action
        console.log("Ayuda clicked")
      },
    },
  ]

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden",
        "pb-[max(env(safe-area-inset-bottom),0px)]",
        className,
      )}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {mainNavItems.map((item) => (
          <Link key={item.href} href={item.href} className="flex-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2 px-1 relative min-h-[44px]",
                item.isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
              {item.badge && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          </Link>
        ))}

        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center gap-1 h-auto py-2 px-1 text-muted-foreground hover:text-foreground min-h-[44px]"
            >
              <Menu className="w-5 h-5" />
              <span className="text-xs font-medium">Menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <div className="py-4">
              <h3 className="text-lg font-semibold mb-4">Menú</h3>
              <div className="grid grid-cols-2 gap-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      if (item.onClick) {
                        item.onClick()
                      }
                      setIsMenuOpen(false)
                    }}
                  >
                    <Button variant="outline" className="w-full justify-start gap-3 h-12 bg-transparent">
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
