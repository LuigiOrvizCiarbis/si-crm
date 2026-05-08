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
import { useTranslation } from "@/hooks/useTranslation"

const TYPE_ICONS: Record<string, string> = {
  lead: "🎯",
  message: "💬",
  task: "✅",
  assignment: "👤",
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  const notifications = [
    { id: 1, type: "lead", message: t("dashboard.notifications.demoLead"), time: t("dashboard.notifications.demoLeadTime") },
    { id: 2, type: "message", message: t("dashboard.notifications.demoMessage"), time: t("dashboard.notifications.demoMessageTime") },
    { id: 3, type: "task", message: t("dashboard.notifications.demoTask"), time: t("dashboard.notifications.demoTaskTime") },
    { id: 4, type: "assignment", message: t("dashboard.notifications.demoAssignment"), time: t("dashboard.notifications.demoAssignmentTime") },
  ]

  const unreadCount = notifications.length

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
        <DropdownMenuLabel>{t("dashboard.notifications.title")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} className="flex gap-3 p-3 cursor-pointer">
              <span className="text-lg">{TYPE_ICONS[notification.type]}</span>
              <div className="flex-1 space-y-1">
                <p className="text-sm">{notification.message}</p>
                <p className="text-xs text-muted-foreground">{notification.time}</p>
              </div>
            </DropdownMenuItem>
          ))}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center cursor-pointer">
          {t("dashboard.notifications.viewAll")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
