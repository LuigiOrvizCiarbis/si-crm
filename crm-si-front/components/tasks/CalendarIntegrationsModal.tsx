"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Check, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface Integration {
  id: string
  name: string
  icon: string
  connected: boolean
  color: string
}

interface CalendarIntegrationsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
  taskName: string
  onSync: (provider: string) => void
}

export function CalendarIntegrationsModal({
  open,
  onOpenChange,
  taskId,
  taskName,
  onSync,
}: CalendarIntegrationsModalProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "google",
      name: "Google Calendar",
      icon: "🗓️",
      connected: false,
      color: "bg-blue-500",
    },
    {
      id: "outlook",
      name: "Outlook / Microsoft 365",
      icon: "📅",
      connected: false,
      color: "bg-sky-500",
    },
    {
      id: "icloud",
      name: "iCloud Calendar",
      icon: "☁️",
      connected: false,
      color: "bg-gray-500",
    },
    {
      id: "caldav",
      name: "CalDAV",
      icon: "📆",
      connected: false,
      color: "bg-purple-500",
    },
  ])

  const [showConnectModal, setShowConnectModal] = useState<string | null>(null)

  const handleConnect = (integrationId: string) => {
    // Mock connection
    setIntegrations((prev) => prev.map((int) => (int.id === integrationId ? { ...int, connected: true } : int)))
    toast.success(`Conectado a ${integrations.find((i) => i.id === integrationId)?.name}`)
    setShowConnectModal(null)
  }

  const handleSyncToCalendar = (provider: string) => {
    onSync(provider)
    toast.success(`Tarea "${taskName}" sincronizada con ${integrations.find((i) => i.id === provider)?.name}`)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Integraciones de Calendario</DialogTitle>
            <DialogDescription>Conecta tu calendario para sincronizar tareas automáticamente</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {integrations.map((integration) => (
              <Card key={integration.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg ${integration.color} flex items-center justify-center text-2xl`}
                    >
                      {integration.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{integration.name}</h4>
                      {integration.connected ? (
                        <Badge
                          variant="outline"
                          className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30 mt-1"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Conectado
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No conectado</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {integration.connected ? (
                      <Button size="sm" onClick={() => handleSyncToCalendar(integration.id)}>
                        Enviar tarea
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setShowConnectModal(integration.id)}>
                        Conectar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Connect Modal */}
      <Dialog open={!!showConnectModal} onOpenChange={(open) => !open && setShowConnectModal(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Conectar {integrations.find((i) => i.id === showConnectModal)?.name}</DialogTitle>
            <DialogDescription>Sigue estos pasos para conectar tu calendario</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">1. Autoriza el acceso a tu calendario</p>
              <p className="text-sm text-muted-foreground">2. Selecciona los calendarios a sincronizar</p>
              <p className="text-sm text-muted-foreground">3. Confirma los permisos</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => handleConnect(showConnectModal!)} className="flex-1">
                <ExternalLink className="w-4 h-4 mr-2" />
                Autorizar
              </Button>
              <Button variant="outline" onClick={() => setShowConnectModal(null)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
