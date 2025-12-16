"use client"
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
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
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
  const leads = useAppStore((state) => state.leads)
  const moveLeadToStage = useAppStore((state) => state.moveLeadToStage)
  const stageColors = useAppStore((state) => state.stageColors)
  const { addToast } = useToast()

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
      })),
  }))

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts (allows scrolling)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const totalLeads = leads.length
  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0)
  const weightedProbability = leads.reduce((sum, lead) => sum + (lead.value * lead.probability) / 100, 0)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const sourceLead = leads.find((lead) => lead.id === activeId)
    if (!sourceLead) return

    const sourceStage = sourceLead.stage
    const destStage = columns.find((col) => col.id === overId || col.leads.some((lead) => lead.id === overId))

    if (!destStage) return

    if (sourceStage !== destStage.id) {
      console.log("[v0] Moving lead", activeId, "from", sourceStage, "to", destStage.id)
      moveLeadToStage(activeId, destStage.id)

      addToast({
        type: "success",
        title: "Lead movido",
        description: `${sourceLead.name} movido a ${destStage.title}`,
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
