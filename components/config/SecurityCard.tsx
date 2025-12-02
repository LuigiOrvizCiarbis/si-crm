"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useConfigStore } from "@/store/useConfigStore"
import { Shield, Smartphone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SecurityCard() {
  const { security, setSecurity, removeSession } = useConfigStore()
  const { toast } = useToast()

  const handleToggle2FA = () => {
    setSecurity({ twoFAEnabled: !security.twoFAEnabled })
    toast({
      title: security.twoFAEnabled ? "2FA desactivado" : "2FA activado",
      description: security.twoFAEnabled
        ? "La autenticación de dos factores se desactivó"
        : "La autenticación de dos factores se activó correctamente",
    })
  }

  const handleRemoveSession = (id: string) => {
    removeSession(id)
    toast({
      title: "Sesión cerrada",
      description: "La sesión se cerró correctamente",
    })
  }

  return (
    <Card className="rounded-2xl border-[#1e2533]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Seguridad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 2FA */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Autenticación de dos factores (2FA)</p>
              <p className="text-sm text-muted-foreground">Agrega una capa extra de seguridad a tu cuenta</p>
            </div>
            <Badge variant={security.twoFAEnabled ? "default" : "outline"}>
              {security.twoFAEnabled ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <Button variant="outline" onClick={handleToggle2FA} className="w-full bg-transparent">
            {security.twoFAEnabled ? "Desactivar 2FA" : "Activar 2FA"}
          </Button>
        </div>

        {/* Sesiones activas */}
        <div className="space-y-3">
          <p className="font-medium">Sesiones activas</p>
          {security.sesiones.map((sesion) => (
            <div key={sesion.id} className="flex items-center justify-between p-3 rounded-lg border border-[#1e2533]">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {sesion.agente} — {sesion.dispositivo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Última actividad: {sesion.ultimaActividad}
                    {sesion.actual && " · Actual"}
                  </p>
                </div>
              </div>
              {!sesion.actual && (
                <Button variant="ghost" size="sm" onClick={() => handleRemoveSession(sesion.id)}>
                  Cerrar sesión
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
