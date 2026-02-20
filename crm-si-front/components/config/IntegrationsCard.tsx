"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useConfigStore } from "@/store/useConfigStore"
import { Plug } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"

const descKeys: Record<string, string> = {
  whatsapp: "settings.intWhatsAppDesc",
  instagram: "settings.intInstagramDesc",
  facebook: "settings.intFacebookDesc",
  telegram: "settings.intTelegramDesc",
  smtp: "settings.intSmtpDesc",
  gcal: "settings.intGcalDesc",
  mp: "settings.intMpDesc",
  stripe: "settings.intStripeDesc",
}

export function IntegrationsCard() {
  const { integrations, toggleIntegration } = useConfigStore()
  const { toast } = useToast()
  const { t } = useTranslation()

  const handleToggle = (id: any) => {
    toggleIntegration(id)
    toast({
      title: t("settings.integrationUpdated"),
      description: t("settings.integrationUpdatedDesc"),
    })
  }

  return (
    <Card className="rounded-2xl border-[#1e2533]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plug className="w-5 h-5" />
          {t("settings.integrations")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="flex items-center justify-between p-3 rounded-lg border border-[#1e2533] hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{integration.icono}</span>
              <div>
                <p className="font-medium">{integration.nombre}</p>
                <p className="text-sm text-muted-foreground">{t(descKeys[integration.id] ?? integration.descripcion)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {integration.conectado ? (
                <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                  {t("settings.connected")}
                </Badge>
              ) : (
                <Badge variant="outline">{t("settings.notConnected")}</Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => handleToggle(integration.id)}>
                {integration.conectado ? t("settings.disconnect") : t("settings.connect")}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
