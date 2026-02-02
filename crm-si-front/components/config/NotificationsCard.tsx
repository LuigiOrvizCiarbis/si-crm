"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useConfigStore } from "@/store/useConfigStore"
import { Bell } from "lucide-react"

export function NotificationsCard() {
  const { notifications, setNotifications } = useConfigStore()

  const notificationTypes = [
    { key: "nuevoMensaje", label: "Nuevo mensaje" },
    { key: "tareaVencida", label: "Tarea vencida" },
    { key: "tareaProxima", label: "Tarea próxima" },
    { key: "cierreVenta", label: "Cierre de una venta" },
    { key: "recordatoriosDiarios", label: "Recordatorios diarios" },
    { key: "reporteSemanal", label: "Reporte semanal" },
  ]

  return (
    <Card className="rounded-2xl border-[#1e2533]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notificaciones
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
