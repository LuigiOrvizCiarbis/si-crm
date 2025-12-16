"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"

const mockNotifications = [
  { id: 1, type: "lead", message: "Nuevo lead: Ana Martínez desde WhatsApp", time: "Hace 5 min" },
  { id: 2, type: "message", message: "Nuevo mensaje de Carlos López", time: "Hace 12 min" },
  { id: 3, type: "task", message: "Tarea vencida: Seguimiento con Juan Pérez", time: "Hace 1 hora" },
  { id: 4, type: "assignment", message: "Lead asignado: María García te asignó un lead", time: "Hace 2 horas" },
]

const typeIcons: Record<string, string> = {
  lead: "🎯",
  message: "💬",
  task: "✅",
  assignment: "👤",
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const unreadCount = mockNotifications.length

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {mockNotifications.map((notification) => (
            <DropdownMenuItem key={notification.id} className="flex gap-3 p-3 cursor-pointer">
              <span className="text-lg">{typeIcons[notification.type]}</span>
              <div className="flex-1 space-y-1">
                <p className="text-sm">{notification.message}</p>
                <p className="text-xs text-muted-foreground">{notification.time}</p>
              </div>
            </DropdownMenuItem>
          ))}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center cursor-pointer">Ver todas</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
