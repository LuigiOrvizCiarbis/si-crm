"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Users, Calendar, Plus, Play, Pause, BarChart3 } from "lucide-react"

export function RemarketingCampaigns() {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [campaignType, setCampaignType] = useState("")

  const campaigns = [
    {
      id: 1,
      name: "Reactivación Leads Fríos",
      status: "active",
      type: "WhatsApp",
      audience: "Leads sin actividad 30+ días",
      sent: 245,
      opened: 189,
      clicked: 67,
      converted: 12,
      created: "2024-01-15",
    },
    {
      id: 2,
      name: "Follow-up Demo Perdidas",
      status: "paused",
      type: "Email",
      audience: "Etapa Demo - Sin respuesta",
      sent: 89,
      opened: 72,
      clicked: 23,
      converted: 5,
      created: "2024-01-10",
    },
    {
      id: 3,
      name: "Oferta Especial Q1",
      status: "scheduled",
      type: "SMS",
      audience: "Clientes activos",
      sent: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
      created: "2024-01-20",
    },
  ]

  const audienceFilters = [
    { id: "stage-captured", label: "Etapa: Capturados", count: 156 },
    { id: "stage-qualified", label: "Etapa: Calificados", count: 89 },
    { id: "stage-demo", label: "Etapa: Demo", count: 45 },
    { id: "stage-closing", label: "Etapa: Cierre", count: 23 },
    { id: "tag-hot", label: "Tag: Hot Lead", count: 67 },
    { id: "tag-cold", label: "Tag: Cold Lead", count: 134 },
    { id: "source-facebook", label: "Fuente: Facebook", count: 98 },
    { id: "source-instagram", label: "Fuente: Instagram", count: 76 },
    { id: "inactive-30", label: "Sin actividad 30+ días", count: 245 },
    { id: "inactive-60", label: "Sin actividad 60+ días", count: 189 },
  ]

  const messageTemplates = [
    {
      id: "reactivation",
      name: "Reactivación Personalizada",
      content:
        "Hola {nombre}, notamos que hace tiempo no hablamos. ¿Seguís interesado en {producto}? Tenemos novedades que te pueden interesar 🚀",
    },
    {
      id: "demo-followup",
      name: "Seguimiento Post-Demo",
      content:
        "¡Hola {nombre}! ¿Qué te pareció la demo de {producto}? ¿Tenés alguna pregunta? Estoy acá para ayudarte 💪",
    },
    {
      id: "special-offer",
      name: "Oferta Especial",
      content:
        "🎉 ¡{nombre}, tenemos una oferta especial para vos! {descuento}% de descuento en {producto}. ¡Solo por tiempo limitado!",
    },
  ]

  return (
    <div className="space-y-6">
      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Campañas</TabsTrigger>
          <TabsTrigger value="create">Crear Campaña</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base">{campaign.name}</CardTitle>
                    <CardDescription>{campaign.audience}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        campaign.status === "active"
                          ? "default"
                          : campaign.status === "paused"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {campaign.status === "active"
                        ? "Activa"
                        : campaign.status === "paused"
                          ? "Pausada"
                          : "Programada"}
                    </Badge>
                    <Badge variant="outline">{campaign.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Enviados</p>
                      <p className="font-semibold">{campaign.sent}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Abiertos</p>
                      <p className="font-semibold">{campaign.opened}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Clicks</p>
                      <p className="font-semibold">{campaign.clicked}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Conversiones</p>
                      <p className="font-semibold text-green-600">{campaign.converted}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-xs text-muted-foreground">Creada: {campaign.created}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Ver Métricas
                      </Button>
                      <Button size="sm" variant="outline">
                        {campaign.status === "active" ? (
                          <Pause className="w-4 h-4 mr-1" />
                        ) : (
                          <Play className="w-4 h-4 mr-1" />
                        )}
                        {campaign.status === "active" ? "Pausar" : "Activar"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nueva Campaña de Remarketing</CardTitle>
              <CardDescription>Crea mensajes masivos personalizados por etapa o etiqueta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campaign-name">Nombre de la Campaña</Label>
                  <Input id="campaign-name" placeholder="Ej: Reactivación Q1 2024" />
                </div>
                <div>
                  <Label htmlFor="campaign-type">Canal</Label>
                  <Select value={campaignType} onValueChange={setCampaignType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar canal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="instagram">Instagram DM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Audiencia Objetivo</Label>
                <Card className="mt-2">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {audienceFilters.map((filter) => (
                        <div key={filter.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={filter.id}
                            checked={selectedContacts.includes(filter.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedContacts([...selectedContacts, filter.id])
                              } else {
                                setSelectedContacts(selectedContacts.filter((id) => id !== filter.id))
                              }
                            }}
                          />
                          <Label htmlFor={filter.id} className="text-sm">
                            {filter.label} ({filter.count})
                          </Label>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-2 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        <Users className="w-4 h-4 inline mr-1" />
                        Audiencia estimada:{" "}
                        {selectedContacts.reduce((acc, id) => {
                          const filter = audienceFilters.find((f) => f.id === id)
                          return acc + (filter?.count || 0)
                        }, 0)}{" "}
                        contactos
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Label htmlFor="message-content">Mensaje</Label>
                <Textarea
                  id="message-content"
                  placeholder="Escribí tu mensaje aquí. Usá {nombre}, {empresa}, {producto} para personalizar..."
                  className="min-h-24"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Variables disponibles: {"{nombre}"}, {"{empresa}"}, {"{producto}"}, {"{descuento}"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="send-date">Fecha de Envío</Label>
                  <Input id="send-date" type="datetime-local" />
                </div>
                <div>
                  <Label htmlFor="frequency">Frecuencia</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Una vez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Una vez</SelectItem>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  Crear y Enviar
                </Button>
                <Button variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Programar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Templates de Mensajes</h3>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Template
            </Button>
          </div>

          <div className="grid gap-4">
            {messageTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{template.content}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Editar
                    </Button>
                    <Button size="sm" variant="outline">
                      Usar Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
