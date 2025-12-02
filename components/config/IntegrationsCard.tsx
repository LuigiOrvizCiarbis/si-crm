"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useConfigStore } from "@/store/useConfigStore"
import { Plug } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

export function IntegrationsCard() {
  const { integrations, toggleIntegration } = useConfigStore()
  const { toast } = useToast()

  const handleToggle = (id: any) => {
    toggleIntegration(id)
    toast({
      title: "Integración actualizada",
      description: "El estado de la integración se actualizó correctamente",
    })
  }

  return (
    <Card className="rounded-2xl border-[#1e2533]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plug className="w-5 h-5" />
          Integraciones
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
                <p className="text-sm text-muted-foreground">{integration.descripcion}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {integration.conectado ? (
                <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                  Conectado
                </Badge>
              ) : (
                <Badge variant="outline">No conectado</Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => handleToggle(integration.id)}>
                {integration.conectado ? "Desconectar" : "Conectar"}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
