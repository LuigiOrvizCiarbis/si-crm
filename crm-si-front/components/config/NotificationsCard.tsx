"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useConfigStore } from "@/store/useConfigStore"
import { Bell } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"

export function NotificationsCard() {
  const { notifications, setNotifications } = useConfigStore()
  const { t } = useTranslation()

  const notificationTypes = [
    { key: "nuevoMensaje", label: t("settings.newMessage") },
    { key: "tareaVencida", label: t("settings.taskOverdue") },
    { key: "tareaProxima", label: t("settings.taskUpcoming") },
    { key: "cierreVenta", label: t("settings.saleClosed") },
    { key: "recordatoriosDiarios", label: t("settings.dailyReminders") },
    { key: "reporteSemanal", label: t("settings.weeklyReport") },
  ]

  return (
    <Card className="rounded-2xl border-[#1e2533]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {t("settings.notifications")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notificationTypes.map((type) => (
          <div key={type.key} className="flex items-center justify-between">
            <Label htmlFor={type.key} className="cursor-pointer">
              {type.label}
            </Label>
            <Switch
              id={type.key}
              checked={notifications[type.key as keyof typeof notifications]}
              onCheckedChange={(checked) => setNotifications({ [type.key]: checked })}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
