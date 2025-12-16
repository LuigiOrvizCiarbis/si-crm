"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge, LeadScoreBadge } from "@/components/Badges"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/Toast"
import { Phone, Mail, Calendar, GripVertical, TrendingUp, Clock } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { PipelineTaskIndicator } from "@/components/PipelineTaskIndicator"
import { useAppStore } from "@/store/useAppStore"
import { StageColorPicker } from "@/components/stage-color-picker"

interface Lead {
  id: string
  name: string
  company: string
  value: number
  source: string
  avatar?: string
  lastContact: string
  phone?: string
  email?: string
  probability: number // 0-100
  estimatedDate: string
  leadScore: number
  owner: string
  stage: string
}

interface Column {
  id: string
  title: string
  leads: Lead[]
  color: string
}

const initialData: Column[] = [
  {
    id: "prospecto",
    title: "Lead/Prospecto",
    color: "bg-blue-500",
    leads: Array.from({ length: 28 }, (_, i) => ({
      id: `prospecto-${i + 1}`,
      name: `Lead ${i + 1}`,
      company: `Empresa ${i + 1}`,
      value: Math.floor(Math.random() * 50000) + 5000,
      source: ["WhatsApp", "Instagram", "LinkedIn", "Web", "Facebook"][Math.floor(Math.random() * 5)],
      lastContact: `Hace ${Math.floor(Math.random() * 48)}h`,
      phone: `+54 ${Math.random() > 0.5 ? "11" : "223"} ${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`,
      email: `lead${i + 1}@empresa.com`,
      probability: 15,
      estimatedDate: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      leadScore: Math.floor(Math.random() * 40) + 40,
      owner: ["Martín", "Valeria", "Sergio", "Daniel"][Math.floor(Math.random() * 4)],
      stage: "prospecto",
    })),
  },
  {
    id: "contactado",
    title: "Contactado",
    color: "bg-cyan-500",
    leads: Array.from({ length: 22 }, (_, i) => ({
      id: `contactado-${i + 1}`,
      name: `Contacto ${i + 1}`,
      company: `Empresa ${i + 1}`,
      value: Math.floor(Math.random() * 50000) + 10000,
      source: ["WhatsApp", "Instagram", "LinkedIn", "Email"][Math.floor(Math.random() * 4)],
      lastContact: `Hace ${Math.floor(Math.random() * 24)}h`,
      phone: `+54 ${Math.random() > 0.5 ? "11" : "223"} ${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`,
      email: `contacto${i + 1}@empresa.com`,
      probability: 25,
      estimatedDate: new Date(Date.now() + Math.random() * 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      leadScore: Math.floor(Math.random() * 30) + 50,
      owner: ["Martín", "Valeria", "Sergio", "Daniel"][Math.floor(Math.random() * 4)],
      stage: "contactado",
    })),
  },
  {
    id: "seguimiento",
    title: "En seguimiento",
    color: "bg-indigo-500",
    leads: Array.from({ length: 11 }, (_, i) => ({
      id: `seguimiento-${i + 1}`,
      name: `Seguimiento ${i + 1}`,
      company: `Empresa ${i + 1}`,
      value: Math.floor(Math.random() * 60000) + 15000,
      source: ["WhatsApp", "LinkedIn", "Email"][Math.floor(Math.random() * 3)],
      lastContact: `Hace ${Math.floor(Math.random() * 12)}h`,
      phone: `+54 ${Math.random() > 0.5 ? "11" : "223"} ${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`,
      email: `seguimiento${i + 1}@empresa.com`,
      probability: 40,
      estimatedDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      leadScore: Math.floor(Math.random() * 25) + 60,
      owner: ["Martín", "Valeria", "Daniel"][Math.floor(Math.random() * 3)],
      stage: "seguimiento",
    })),
  },
  {
    id: "propuesta",
    title: "Envié propuesta",
    color: "bg-purple-500",
    leads: Array.from({ length: 2 }, (_, i) => ({
      id: `propuesta-${i + 1}`,
      name: `Propuesta ${i + 1}`,
      company: `Empresa ${i + 1}`,
      value: Math.floor(Math.random() * 70000) + 20000,
      source: ["WhatsApp", "LinkedIn"][i],
      lastContact: `Hace ${Math.floor(Math.random() * 6)}h`,
      phone: `+54 11 ${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`,
      email: `propuesta${i + 1}@empresa.com`,
      probability: 55,
      estimatedDate: new Date(Date.now() + Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      leadScore: Math.floor(Math.random() * 15) + 70,
      owner: ["Martín", "Daniel"][i],
      stage: "propuesta",
    })),
  },
  {
    id: "interesado",
    title: "Interesado",
    color: "bg-pink-500",
    leads: Array.from({ length: 8 }, (_, i) => ({
      id: `interesado-${i + 1}`,
      name: `Interesado ${i + 1}`,
      company: `Empresa ${i + 1}`,
      value: Math.floor(Math.random() * 80000) + 25000,
      source: ["WhatsApp", "LinkedIn", "Email"][Math.floor(Math.random() * 3)],
      lastContact: `Hace ${Math.floor(Math.random() * 8)}h`,
      phone: `+54 ${Math.random() > 0.5 ? "11" : "223"} ${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`,
      email: `interesado${i + 1}@empresa.com`,
      probability: 65,
      estimatedDate: new Date(Date.now() + Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      leadScore: Math.floor(Math.random() * 15) + 75,
      owner: ["Martín", "Valeria", "Sergio", "Daniel"][Math.floor(Math.random() * 4)],
      stage: "interesado",
    })),
  },
  {
    id: "recontactar",
    title: "Re-contactar",
    color: "bg-amber-500",
    leads: Array.from({ length: 33 }, (_, i) => ({
      id: `recontactar-${i + 1}`,
      name: `Recontactar ${i + 1}`,
      company: `Empresa ${i + 1}`,
      value: Math.floor(Math.random() * 40000) + 5000,
      source: ["WhatsApp", "Instagram", "LinkedIn", "Facebook", "Web"][Math.floor(Math.random() * 5)],
      lastContact: `Hace ${Math.floor(Math.random() * 72) + 24}h`,
      phone: `+54 ${Math.random() > 0.5 ? "11" : "223"} ${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`,
      email: `recontactar${i + 1}@empresa.com`,
      probability: 20,
      estimatedDate: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      leadScore: Math.floor(Math.random() * 30) + 45,
      owner: ["Martín", "Valeria", "Sergio", "Daniel"][Math.floor(Math.random() * 4)],
      stage: "recontactar",
    })),
  },
  {
    id: "entrevista-pactada",
    title: "Entrevista pactada",
    color: "bg-teal-500",
    leads: Array.from({ length: 1 }, (_, i) => ({
      id: `entrevista-pactada-${i + 1}`,
      name: "Pedro Gómez",
      company: "Gómez Inversiones",
      value: 45000,
      source: "LinkedIn",
      lastContact: "Hace 2h",
      phone: "+54 11 6543-2109",
      email: "pedro@gomezinversiones.com",
      probability: 70,
      estimatedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      leadScore: 88,
      owner: "Martín",
      stage: "entrevista-pactada",
    })),
  },
  {
    id: "entrevista-realizada",
    title: "Entrevista realizada",
    color: "bg-emerald-500",
    leads: Array.from({ length: 8 }, (_, i) => ({
      id: `entrevista-realizada-${i + 1}`,
      name: `Entrevistado ${i + 1}`,
      company: `Empresa ${i + 1}`,
      value: Math.floor(Math.random() * 90000) + 30000,
      source: ["WhatsApp", "LinkedIn", "Email"][Math.floor(Math.random() * 3)],
      lastContact: `Hace ${Math.floor(Math.random() * 12)}h`,
      phone: `+54 11 ${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`,
      email: `entrevista${i + 1}@empresa.com`,
      probability: 75,
      estimatedDate: new Date(Date.now() + Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      leadScore: Math.floor(Math.random() * 10) + 80,
      owner: ["Martín", "Valeria", "Daniel"][Math.floor(Math.random() * 3)],
      stage: "entrevista-realizada",
    })),
  },
  {
    id: "reagendar",
    title: "Reagendar entrevista",
    color: "bg-orange-500",
    leads: [],
  },
  {
    id: "segunda-entrevista",
    title: "2da Entrevista",
    color: "bg-lime-500",
    leads: Array.from({ length: 4 }, (_, i) => ({
      id: `segunda-entrevista-${i + 1}`,
      name: `Segunda entrevista ${i + 1}`,
      company: `Empresa ${i + 1}`,
      value: Math.floor(Math.random() * 100000) + 40000,
      source: ["WhatsApp", "LinkedIn"][Math.floor(Math.random() * 2)],
      lastContact: `Hace ${Math.floor(Math.random() * 6)}h`,
      phone: `+54 11 ${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`,
      email: `segunda${i + 1}@empresa.com`,
      probability: 85,
      estimatedDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      leadScore: Math.floor(Math.random() * 10) + 88,
      owner: ["Martín", "Valeria"][Math.floor(Math.random() * 2)],
      stage: "segunda-entrevista",
    })),
  },
  {
    id: "cierre",
    title: "Seguimiento para cierre",
    color: "bg-green-500",
    leads: Array.from({ length: 2 }, (_, i) => ({
      id: `cierre-${i + 1}`,
      name: `Cierre ${i + 1}`,
      company: `Empresa ${i + 1}`,
      value: Math.floor(Math.random() * 120000) + 50000,
      source: ["LinkedIn", "WhatsApp"][i],
      lastContact: `Hace ${Math.floor(Math.random() * 4)}h`,
      phone: `+54 11 ${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`,
      email: `cierre${i + 1}@empresa.com`,
      probability: 92,
      estimatedDate: new Date(Date.now() + Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      leadScore: Math.floor(Math.random() * 5) + 94,
      owner: ["Martín", "Daniel"][Math.floor(Math.random() * 2)],
      stage: "cierre",
    })),
  },
  {
    id: "convertido",
    title: "Cliente Convertido",
    color: "bg-green-600",
    leads: Array.from({ length: 5 }, (_, i) => ({
      id: `convertido-${i + 1}`,
      name: `Cliente ${i + 1}`,
      company: `Empresa ${i + 1}`,
      value: Math.floor(Math.random() * 150000) + 60000,
      source: ["LinkedIn", "WhatsApp", "Email"][Math.floor(Math.random() * 3)],
      lastContact: `Hace ${Math.floor(Math.random() * 24)}h`,
      phone: `+54 11 ${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`,
      email: `cliente${i + 1}@empresa.com`,
      probability: 100,
      estimatedDate: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      leadScore: 98,
      owner: ["Martín", "Valeria", "Daniel"][Math.floor(Math.random() * 3)],
      stage: "convertido",
    })),
  },
  {
    id: "no-interesa",
    title: "No le interesa",
    color: "bg-red-500",
    leads: Array.from({ length: 2 }, (_, i) => ({
      id: `no-interesa-${i + 1}`,
      name: `No interesado ${i + 1}`,
      company: `Empresa ${i + 1}`,
      value: Math.floor(Math.random() * 30000) + 5000,
      source: ["Instagram", "Web"][i],
      lastContact: `Hace ${Math.floor(Math.random() * 48) + 24}h`,
      email: `nointeresa${i + 1}@empresa.com`,
      probability: 0,
      estimatedDate: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      leadScore: Math.floor(Math.random() * 20) + 30,
      owner: ["Sergio", "Valeria"][i],
      stage: "no-interesa",
    })),
  },
  {
    id: "partner",
    title: "Partner/Colega",
    color: "bg-violet-500",
    leads: Array.from({ length: 6 }, (_, i) => ({
      id: `partner-${i + 1}`,
      name: `Partner ${i + 1}`,
      company: `Empresa ${i + 1}`,
      value: Math.floor(Math.random() * 100000) + 30000,
      source: ["LinkedIn", "Email", "WhatsApp"][Math.floor(Math.random() * 3)],
      lastContact: `Hace ${Math.floor(Math.random() * 48)}h`,
      phone: `+54 11 ${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`,
      email: `partner${i + 1}@empresa.com`,
      probability: 50,
      estimatedDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      leadScore: Math.floor(Math.random() * 20) + 70,
      owner: ["Martín", "Valeria", "Daniel"][Math.floor(Math.random() * 3)],
      stage: "partner",
    })),
  },
]

function SortableLeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`mb-3 cursor-move hover:shadow-md transition-shadow ${isDragging ? "shadow-lg" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={lead.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-xs">
                {lead.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium text-sm">{lead.name}</h4>
              <p className="text-xs text-muted-foreground">{lead.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <LeadScoreBadge score={lead.leadScore} />
            <PipelineTaskIndicator pipelineId={lead.id} />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="default" className="text-xs">
              {lead.source}
            </Badge>
            <span className="font-semibold text-sm">${lead.value.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="font-medium">{lead.probability}%</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>
                {new Date(lead.estimatedDate).toLocaleDateString("es-ES", { month: "short", day: "numeric" })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{lead.lastContact}</span>
            <span>•</span>
            <span>{lead.owner}</span>
          </div>

          <div className="flex gap-1">
            {lead.phone && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Phone className="w-3 h-3" />
              </Button>
            )}
            {lead.email && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Mail className="w-3 h-3" />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Calendar className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function KanbanColumn({ column, leads }: { column: Column; leads: Lead[] }) {
  const stageColors = useAppStore((state) => state.stageColors)
  const stageColor = stageColors.find((s) => s.id === column.id)?.color || column.color

  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0)
  const avgProbability =
    leads.length > 0 ? Math.round(leads.reduce((sum, lead) => sum + lead.probability, 0) / leads.length) : 0

  return (
    <div className="flex-1 min-w-80">
      <Card className="bg-muted/20 overflow-hidden">
        <div className="h-2 w-full" style={{ backgroundColor: stageColor }} />

        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stageColor }} />
            <h3 className="font-semibold flex-1">{column.title}</h3>
            <StageColorPicker stageId={column.id} currentColor={stageColor} />
            <Badge variant="default" className="ml-1">
              {leads.length}
            </Badge>
          </div>

          <div className="space-y-1 mb-4">
            <p className="text-sm font-medium">${totalValue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Prob. promedio: {avgProbability}%</p>
          </div>

          <SortableContext items={leads.map((lead) => lead.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 min-h-96">
              {leads.map((lead) => (
                <SortableLeadCard key={lead.id} lead={lead} />
              ))}

              {leads.length === 0 && (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  No hay leads en esta etapa
                </div>
              )}
            </div>
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  )
}

export function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(initialData)
  const { addToast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const totalLeads = columns.reduce((sum, col) => sum + col.leads.length, 0)
  const totalValue = columns.reduce((sum, col) => sum + col.leads.reduce((colSum, lead) => colSum + lead.value, 0), 0)
  const weightedProbability = columns.reduce((sum, col) => {
    const colValue = col.leads.reduce((colSum, lead) => colSum + (lead.value * lead.probability) / 100, 0)
    return sum + colValue
  }, 0)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const sourceColumn = columns.find((col) => col.leads.some((lead) => lead.id === activeId))
    const destColumn = columns.find((col) => col.id === overId || col.leads.some((lead) => lead.id === overId))

    if (!sourceColumn || !destColumn) return

    const sourceLead = sourceColumn.leads.find((lead) => lead.id === activeId)
    if (!sourceLead) return

    if (sourceColumn.id !== destColumn.id) {
      setColumns((prevColumns) => {
        return prevColumns.map((col) => {
          if (col.id === sourceColumn.id) {
            return {
              ...col,
              leads: col.leads.filter((lead) => lead.id !== activeId),
            }
          }
          if (col.id === destColumn.id) {
            const updatedLead = {
              ...sourceLead,
              stage: destColumn.id,
              probability:
                destColumn.id === "prospecto"
                  ? 15
                  : destColumn.id === "contactado"
                    ? 25
                    : destColumn.id === "seguimiento"
                      ? 40
                      : destColumn.id === "propuesta"
                        ? 55
                        : destColumn.id === "interesado"
                          ? 65
                          : destColumn.id === "recontactar"
                            ? 20
                            : destColumn.id === "entrevista-pactada"
                              ? 70
                              : destColumn.id === "entrevista-realizada"
                                ? 75
                                : destColumn.id === "reagendar"
                                  ? 60
                                  : destColumn.id === "segunda-entrevista"
                                    ? 85
                                    : destColumn.id === "cierre"
                                      ? 92
                                      : destColumn.id === "convertido"
                                        ? 100
                                        : destColumn.id === "no-interesa"
                                          ? 0
                                          : destColumn.id === "partner"
                                            ? 50
                                            : 50,
            }
            return {
              ...col,
              leads: [...col.leads, updatedLead],
            }
          }
          return col
        })
      })

      addToast({
        type: "success",
        title: "Lead movido",
        description: `${sourceLead.name} movido a ${destColumn.title}`,
      })
    } else {
      const sourceIndex = sourceColumn.leads.findIndex((lead) => lead.id === activeId)
      const destIndex = sourceColumn.leads.findIndex((lead) => lead.id === overId)

      if (sourceIndex !== destIndex) {
        setColumns((prevColumns) => {
          return prevColumns.map((col) => {
            if (col.id === sourceColumn.id) {
              const newLeads = arrayMove(col.leads, sourceIndex, destIndex)
              return { ...col, leads: newLeads }
            }
            return col
          })
        })
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-sm text-muted-foreground">Total oportunidades</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Valor total pipeline</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">${Math.round(weightedProbability).toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Valor ponderado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">${Math.round(totalValue / totalLeads).toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Valor promedio</p>
          </CardContent>
        </Card>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn key={column.id} column={column} leads={column.leads} />
          ))}
        </div>
      </DndContext>
    </div>
  )
}
