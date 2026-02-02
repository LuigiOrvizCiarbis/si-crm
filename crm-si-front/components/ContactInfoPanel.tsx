"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Phone, MessageSquare, Edit2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface ContactInfo {
  id: string
  name: string
  phone: string
  email: string
  company: string
  position: string
  source: string
  stage: "nuevo" | "calificado" | "demo" | "cierre"
  service: string
  assignee: string
  createdAt: string
  avatar?: string
  tags: string[]
  customFields: Record<string, string>
}

interface ContactInfoPanelProps {
  contactId: number
  isOpen: boolean
  onClose: () => void
  className?: string
}

// Mock data - en producción vendría de la base de datos
const mockContactData: Record<string, ContactInfo> = {
  conv1: {
    id: "conv1",
    name: "María González",
    phone: "+54 11 1234-5678",
    email: "maria@empresa.com",
    company: "Tech Solutions SA",
    position: "Directora de Marketing",
    source: "LinkedIn",
    stage: "calificado",
    service: "CRM Enterprise",
    assignee: "Luigi Ciarbis",
    createdAt: "2024-01-15",
    avatar: "/placeholder.svg?height=120&width=120",
    tags: ["VIP", "Enterprise"],
    customFields: {
      tratamiento: "",
    },
  },
  conv2: {
    id: "conv2",
    name: "Carlos Pérez",
    phone: "+54 11 9876-5432",
    email: "carlos@startup.io",
    company: "StartupIO",
    position: "CEO",
    source: "Instagram",
    stage: "demo",
    service: "CRM Startup",
    assignee: "Julieta Vendedora",
    createdAt: "2024-01-14",
    avatar: "/placeholder.svg?height=120&width=120",
    tags: ["Startup", "Tech"],
    customFields: {
      tratamiento: "",
    },
  },
  conv3: {
    id: "conv3",
    name: "Ana Martín",
    phone: "+54 11 5555-1234",
    email: "ana@retail.com",
    company: "Retail Plus",
    position: "Gerente de Ventas",
    source: "WhatsApp",
    stage: "calificado",
    service: "CRM Pro",
    assignee: "Pablo Vendedor",
    createdAt: "2024-01-13",
    avatar: "/placeholder.svg?height=120&width=120",
    tags: ["Retail", "Recurrente"],
    customFields: {
      tratamiento: "",
    },
  },
}

export function ContactInfoPanel({ contactId, isOpen, onClose, className }: ContactInfoPanelProps) {
  const [contact, setContact] = useState<ContactInfo>(
    mockContactData[contactId] || {
      id: contactId,
      name: "Contacto",
      phone: "",
      email: "",
      company: "",
      position: "",
      source: "",
      stage: "nuevo",
      service: "",
      assignee: "",
      createdAt: new Date().toISOString().split("T")[0],
      tags: [],
      customFields: {},
    },
  )
  const [isEditing, setIsEditing] = useState(false)
  const [aiActive, setAiActive] = useState(true)

  const handleSave = () => {
    setIsEditing(false)
    // Aquí se guardarían los cambios en la base de datos
  }

  const addTag = () => {
    const newTag = prompt("Ingrese el nombre del tag:")
    if (newTag) {
      setContact({ ...contact, tags: [...contact.tags, newTag] })
    }
  }

  const removeTag = (tagToRemove: string) => {
    setContact({ ...contact, tags: contact.tags.filter((tag) => tag !== tagToRemove) })
  }

  const stageLabels = {
    nuevo: "Nuevo",
    calificado: "Calificado",
    demo: "Demo",
    cierre: "Cierre",
  }

  const stageColors = {
    nuevo: "bg-blue-500/10 text-blue-600 border-blue-200",
    calificado: "bg-orange-500/10 text-orange-600 border-orange-200",
    demo: "bg-purple-500/10 text-purple-600 border-purple-200",
    cierre: "bg-green-500/10 text-green-600 border-green-200",
  }

  if (!isOpen) return null

  return (
    <div
      className={cn(
        "w-96 border-l border-border bg-card flex flex-col h-full overflow-hidden transition-all duration-300",
        className,
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
        <h2 className="font-semibold text-lg">Información del Contacto</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Avatar y teléfono */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="w-32 h-32">
              <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
              <AvatarFallback className="text-2xl">
                {contact.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-card flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="text-center w-full">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h3 className="text-2xl font-semibold">{contact.phone}</h3>
              {isEditing && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Edit2 className="w-3 h-3" />
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{contact.phone}</p>
          </div>
        </div>

        {/* Estado y Agente IA */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium text-green-600">Activo</span>
          </div>

          <Button variant="outline" className="w-full bg-transparent" onClick={() => setAiActive(!aiActive)}>
            <Plus className="w-4 h-4 mr-2" />
            {aiActive ? "Pausar Agente IA" : "Activar Agente IA"}
          </Button>
        </div>

        {/* Información del contacto */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Nombre completo</Label>
            {isEditing ? (
              <Input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
            ) : (
              <p className="text-sm font-medium">{contact.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Email</Label>
            {isEditing ? (
              <Input
                type="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
              />
            ) : (
              <p className="text-sm font-medium">{contact.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Empresa</Label>
            {isEditing ? (
              <Input value={contact.company} onChange={(e) => setContact({ ...contact, company: e.target.value })} />
            ) : (
              <p className="text-sm font-medium">{contact.company}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Puesto</Label>
            {isEditing ? (
              <Input value={contact.position} onChange={(e) => setContact({ ...contact, position: e.target.value })} />
            ) : (
              <p className="text-sm font-medium">{contact.position}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Etapa del embudo</Label>
            {isEditing ? (
              <Select value={contact.stage} onValueChange={(value: any) => setContact({ ...contact, stage: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nuevo">Nuevo</SelectItem>
                  <SelectItem value="calificado">Calificado</SelectItem>
                  <SelectItem value="demo">Demo</SelectItem>
                  <SelectItem value="cierre">Cierre</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge className={stageColors[contact.stage]} variant="outline">
                {stageLabels[contact.stage]}
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Servicio de interés</Label>
            {isEditing ? (
              <Input value={contact.service} onChange={(e) => setContact({ ...contact, service: e.target.value })} />
            ) : (
              <p className="text-sm font-medium">{contact.service}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Agente asignado</Label>
            {isEditing ? (
              <Select value={contact.assignee} onValueChange={(value) => setContact({ ...contact, assignee: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Luigi Ciarbis">Luigi Ciarbis</SelectItem>
                  <SelectItem value="Julieta Vendedora">Julieta Vendedora</SelectItem>
                  <SelectItem value="Pablo Vendedor">Pablo Vendedor</SelectItem>
                  <SelectItem value="Claudia Supervisor">Claudia Supervisor</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm font-medium">{contact.assignee}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Origen del dato</Label>
            <p className="text-sm font-medium">{contact.source}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Fecha de creación</Label>
            <p className="text-sm font-medium">{contact.createdAt}</p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tags</Label>
            <div className="flex flex-wrap gap-2">
              {contact.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="gap-1">
                  {tag}
                  {isEditing && (
                    <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {isEditing && (
                <Button variant="outline" size="sm" onClick={addTag} className="h-6 px-2 bg-transparent">
                  <Plus className="w-3 h-3 mr-1" />
                  Agregar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Campos Adicionales Disponibles */}
        <div className="space-y-3 pt-4 border-t border-border">
          <h3 className="font-medium text-sm">Campos Adicionales Disponibles</h3>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tratamiento</Label>
            <Select
              value={contact.customFields.tratamiento}
              onValueChange={(value) =>
                setContact({ ...contact, customFields: { ...contact.customFields, tratamiento: value } })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar opción..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sr">Sr.</SelectItem>
                <SelectItem value="sra">Sra.</SelectItem>
                <SelectItem value="dr">Dr.</SelectItem>
                <SelectItem value="dra">Dra.</SelectItem>
                <SelectItem value="ing">Ing.</SelectItem>
                <SelectItem value="lic">Lic.</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex gap-2 pt-4 border-t border-border">
          <Button variant="outline" className="flex-1 gap-2 bg-transparent" asChild>
            <a href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">
              <MessageSquare className="w-4 h-4" />
              Abrir en WhatsApp
            </a>
          </Button>
          <Button variant="outline" className="flex-1 gap-2 bg-transparent" asChild>
            <a href={`tel:${contact.phone}`}>
              <Phone className="w-4 h-4" />
              Llamar
            </a>
          </Button>
        </div>
      </div>

      {/* Footer con botón de editar/guardar */}
      <div className="p-4 border-t border-border sticky bottom-0 bg-card">
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              Guardar cambios
            </Button>
          </div>
        ) : (
          <Button className="w-full" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Editar información
          </Button>
        )}
      </div>
    </div>
  )
}
