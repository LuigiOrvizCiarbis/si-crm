"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useConfigStore } from "@/store/useConfigStore"
import { Shield, Smartphone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"

export function SecurityCard() {
  const { security, setSecurity, removeSession } = useConfigStore()
  const { toast } = useToast()
  const { t } = useTranslation()

  const handleToggle2FA = () => {
    setSecurity({ twoFAEnabled: !security.twoFAEnabled })
    toast({
      title: security.twoFAEnabled ? t("settings.disable2FA") : t("settings.enable2FA"),
    })
  }

  const handleRemoveSession = (id: string) => {
    removeSession(id)
    toast({
      title: t("settings.logoutSession"),
    })
  }

  return (
    <Card className="rounded-2xl border-[#1e2533]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {t("settings.security")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 2FA */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("settings.twoFA")}</p>
              <p className="text-sm text-muted-foreground">{t("settings.twoFADesc")}</p>
            </div>
            <Badge variant={security.twoFAEnabled ? "default" : "outline"}>
              {security.twoFAEnabled ? t("settings.active") : t("settings.inactive")}
            </Badge>
          </div>
          <Button variant="outline" onClick={handleToggle2FA} className="w-full bg-transparent">
            {security.twoFAEnabled ? t("settings.disable2FA") : t("settings.enable2FA")}
          </Button>
        </div>

        {/* Active sessions */}
        <div className="space-y-3">
          <p className="font-medium">{t("settings.activeSessions")}</p>
          {security.sesiones.map((sesion) => (
            <div key={sesion.id} className="flex items-center justify-between p-3 rounded-lg border border-[#1e2533]">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {sesion.agente} — {sesion.dispositivo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.lastActivity")} {t(sesion.ultimaActividad)}
                    {sesion.actual && ` · ${t("settings.currentSession")}`}
                  </p>
                </div>
              </div>
              {!sesion.actual && (
                <Button variant="ghost" size="sm" onClick={() => handleRemoveSession(sesion.id)}>
                  {t("settings.logoutSession")}
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
