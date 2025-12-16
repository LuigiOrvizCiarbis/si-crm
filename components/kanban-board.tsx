"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge, LeadScoreBadge } from "@/components/Badges"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/Toast"
import { Phone, Mail, Calendar, TrendingUp, Clock } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { PipelineTaskIndicator } from "@/components/PipelineTaskIndicator"
import { useAppStore } from "@/store/useAppStore"
import { StageColorPicker } from "@/components/stage-color-picker"
import { useState } from "react"

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
  sortIndex?: number
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
    leads: [],
  },
  {
    id: "contactado",
    title: "Contactado",
    color: "bg-cyan-500",
    leads: [],
  },
  {
    id: "seguimiento",
    title: "En seguimiento",
    color: "bg-indigo-500",
    leads: [],
  },
  {
    id: "propuesta",
    title: "Envié propuesta",
    color: "bg-purple-500",
    leads: [],
  },
  {
    id: "interesado",
    title: "Interesado",
    color: "bg-pink-500",
    leads: [],
  },
  {
    id: "recontactar",
    title: "Re-contactar",
    color: "bg-amber-500",
    leads: [],
  },
  {
    id: "entrevista-pactada",
    title: "Entrevista pactada",
    color: "bg-teal-500",
    leads: [],
  },
  {
    id: "entrevista-realizada",
    title: "Entrevista realizada",
    color: "bg-emerald-500",
    leads: [],
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
    leads: [],
  },
  {
    id: "cierre",
    title: "Seguimiento para cierre",
    color: "bg-green-500",
    leads: [],
  },
  {
    id: "convertido",
    title: "Cliente Convertido",
    color: "bg-green-600",
    leads: [],
  },
  {
    id: "no-interesa",
    title: "No le interesa",
    color: "bg-red-500",
    leads: [],
  },
  {
    id: "partner",
    title: "Partner/Colega",
    color: "bg-violet-500",
    leads: [],
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
      {...attributes}
      {...listeners}
      className={`mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? "shadow-lg" : ""
      }`}
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

function DroppableColumn({ column, leads }: { column: Column; leads: Lead[] }) {
  const { setNodeRef, isOver } = useSortable({ id: column.id })
  const stageColors = useAppStore((state) => state.stageColors)
  const stageColor = stageColors.find((s) => s.id === column.id)?.color || column.color

  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0)
  const avgProbability =
    leads.length > 0 ? Math.round(leads.reduce((sum, lead) => sum + lead.probability, 0) / leads.length) : 0

  return (
    <div className="flex-1 min-w-80">
      <Card className={`bg-muted/20 overflow-hidden transition-colors ${isOver ? "ring-2 ring-primary" : ""}`}>
        <div className="h-2 w-full" style={{ backgroundColor: stageColor }} />

        <CardContent className="p-4" ref={setNodeRef}>
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
                  Arrastra leads aquí
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
  const leads = useAppStore((state) => state.leads)
  const moveLeadToStage = useAppStore((state) => state.moveLeadToStage)
  const reorderLeadsInStage = useAppStore((state) => state.reorderLeadsInStage)
  const stageColors = useAppStore((state) => state.stageColors)
  const { addToast } = useToast()

  const [activeId, setActiveId] = useState<string | null>(null)
  const activeLead = leads.find((lead) => lead.id === activeId)

  const columns: Column[] = [
    { id: "prospecto", title: "Lead/Prospecto", color: "bg-blue-500", leads: [] },
    { id: "contactado", title: "Contactado", color: "bg-cyan-500", leads: [] },
    { id: "seguimiento", title: "En seguimiento", color: "bg-indigo-500", leads: [] },
    { id: "propuesta", title: "Envié propuesta", color: "bg-purple-500", leads: [] },
    { id: "interesado", title: "Interesado", color: "bg-pink-500", leads: [] },
    { id: "recontactar", title: "Re-contactar", color: "bg-amber-500", leads: [] },
    { id: "entrevista-pactada", title: "Entrevista pactada", color: "bg-teal-500", leads: [] },
    { id: "entrevista-realizada", title: "Entrevista realizada", color: "bg-emerald-500", leads: [] },
    { id: "reagendar", title: "Reagendar entrevista", color: "bg-orange-500", leads: [] },
    { id: "segunda-entrevista", title: "2da Entrevista", color: "bg-lime-500", leads: [] },
    { id: "cierre", title: "Seguimiento para cierre", color: "bg-green-500", leads: [] },
    { id: "convertido", title: "Cliente Convertido", color: "bg-green-600", leads: [] },
    { id: "no-interesa", title: "No le interesa", color: "bg-red-500", leads: [] },
    { id: "partner", title: "Partner/Colega", color: "bg-violet-500", leads: [] },
  ].map((col) => ({
    ...col,
    leads: leads
      .filter((lead) => lead.stage === col.id)
      .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
      .map((lead) => ({
        id: lead.id,
        name: lead.name,
        company: lead.company,
        value: lead.value,
        source: lead.source,
        lastContact: lead.lastContact,
        phone: lead.phone,
        email: lead.email,
        probability: lead.probability,
        estimatedDate: lead.estimatedDate,
        leadScore: lead.leadScore,
        owner: lead.owner,
        stage: lead.stage,
        avatar: lead.avatar,
        sortIndex: lead.sortIndex,
      })),
  }))

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const totalLeads = leads.length
  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0)
  const weightedProbability = leads.reduce((sum, lead) => sum + (lead.value * lead.probability) / 100, 0)

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeLead = leads.find((lead) => lead.id === activeId)
    if (!activeLead) return

    const activeStage = activeLead.stage

    let destStage = overId
    const overLead = leads.find((lead) => lead.id === overId)
    if (overLead) {
      destStage = overLead.stage || activeStage
    }

    const isValidStage = columns.some((col) => col.id === destStage)
    if (!isValidStage) return

    if (activeStage === destStage) {
      const stageLeads = leads
        .filter((lead) => lead.stage === activeStage)
        .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))

      const oldIndex = stageLeads.findIndex((lead) => lead.id === activeId)
      const newIndex = stageLeads.findIndex((lead) => lead.id === overId)

      if (oldIndex !== newIndex) {
        const reordered = arrayMove(stageLeads, oldIndex, newIndex)
        reorderLeadsInStage(
          activeStage,
          reordered.map((l) => l.id),
        )
      }
    } else {
      moveLeadToStage(activeId, destStage)

      const destColumn = columns.find((col) => col.id === destStage)
      addToast({
        type: "success",
        title: "Lead movido",
        description: `${activeLead.name} movido a ${destColumn?.title || destStage}`,
      })
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={columns.map((col) => col.id)} strategy={verticalListSortingStrategy}>
          <div className="flex gap-6 overflow-x-auto pb-4">
            {columns.map((column) => (
              <DroppableColumn key={column.id} column={column} leads={column.leads} />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeLead ? (
            <Card className="opacity-90 shadow-2xl rotate-3">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={activeLead.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">
                      {activeLead.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-sm">{activeLead.name}</h4>
                    <p className="text-xs text-muted-foreground">{activeLead.company}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
