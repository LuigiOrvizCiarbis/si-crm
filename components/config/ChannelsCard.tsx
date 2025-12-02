"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useConfigStore } from "@/store/useConfigStore"
import { MessageSquare, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ChannelsCard() {
  const { channels } = useConfigStore()
  const { toast } = useToast()

  const handleAddChannel = () => {
    toast({
      title: "Agregar canal",
      description: "Funcionalidad en desarrollo",
    })
  }

  return (
    <Card className="rounded-2xl border-[#1e2533]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Canales de Comunicación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {channels.map((channel) => (
          <div key={channel.id} className="flex items-center justify-between p-3 rounded-lg border border-[#1e2533]">
            <div>
              <p className="font-medium">{channel.label}</p>
              <p className="text-sm text-muted-foreground">{channel.handle}</p>
            </div>
            <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
              Activo
            </Badge>
          </div>
        ))}
        <Button variant="outline" onClick={handleAddChannel} className="w-full bg-transparent">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Canal
        </Button>
      </CardContent>
    </Card>
  )
}
