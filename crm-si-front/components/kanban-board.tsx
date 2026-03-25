"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/Badges"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/Toast"
import { getPipelineStages } from "@/lib/api/pipeline"
import { getOpportunities, updateOpportunityStage } from "@/lib/api/opportunities"
import { Phone, Mail, Calendar, GripVertical, Clock, Loader2 } from "lucide-react"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragCancelEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface Opportunity {
  id: number
  title: string
  status: "open" | "won" | "lost" | "archived"
  source_type: "manual" | "conversation"
  value?: string | number | null
  notes?: string | null
  last_activity_at: string | null
  pipeline_stage_id: number | null
  contact: {
    id: number | string
    name: string
    phone: string | null
    email?: string | null
  }
  conversation?: {
    id: number
    last_message_content?: string | null
    last_message_at?: string | null
    channel?: {
      id: number
      name: string
      type: number
    } | null
  } | null
}

interface PipelineStage {
  id: number
  name: string
  sort_order: number
}

interface Column {
  id: number
  title: string
  opportunities: Opportunity[]
  color: string
}

function toStageId(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null

  const numericValue = Number(value)
  return Number.isNaN(numericValue) ? null : numericValue
}

const getColumnDropId = (columnId: number) => `column-${columnId}`

const getChannelIcon = (channelType: number) => {
  switch (channelType) {
    case 1:
      return "📱"
    case 2:
      return "📸"
    case 3:
      return "👍"
    default:
      return "💬"
  }
}

const getChannelColor = (channelType: number) => {
  switch (channelType) {
    case 1:
      return "bg-green-500/10 text-green-600"
    case 2:
      return "bg-pink-500/10 text-pink-600"
    case 3:
      return "bg-blue-500/10 text-blue-600"
    default:
      return "bg-slate-500/10 text-slate-600"
  }
}

function OpportunityCard({
  opportunity,
  dragHandleProps,
  isDragging = false,
  isOverlay = false,
}: {
  opportunity: Opportunity
  dragHandleProps?: Record<string, unknown>
  isDragging?: boolean
  isOverlay?: boolean
}) {
  const lastActivityText = opportunity.last_activity_at
    ? formatDistanceToNow(new Date(opportunity.last_activity_at), { locale: es, addSuffix: true })
    : "Sin actividad"

  const initials = opportunity.contact.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)

  const channel = opportunity.conversation?.channel
  const preview = opportunity.conversation?.last_message_content || opportunity.notes || opportunity.title
  const sourceLabel = channel ? `${getChannelIcon(channel.type)} ${channel.name}` : "Manual"
  const sourceClassName = channel ? getChannelColor(channel.type) : "bg-slate-500/10 text-slate-600"

  return (
    <Card
      className={`cursor-pointer transition-[box-shadow,transform,opacity] ${
        isOverlay ? "rotate-1 shadow-2xl ring-1 ring-primary/20" : "hover:shadow-md"
      } ${isDragging ? "opacity-40 scale-[0.98]" : "opacity-100"}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm truncate">{opportunity.contact.name}</h4>
              <p className="text-xs text-muted-foreground truncate">
                {opportunity.contact.phone || opportunity.contact.email || "Sin dato de contacto"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 shrink-0 ${isOverlay ? "cursor-grabbing" : "cursor-grab active:cursor-grabbing"}`}
            {...dragHandleProps}
          >
            <GripVertical className="w-3 h-3" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs px-2 py-1 rounded ${sourceClassName}`}>
              {sourceLabel}
            </span>
            <Badge variant="default" className="text-xs h-5">
              {opportunity.status}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2">
            {preview || "Sin detalle"}
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{lastActivityText}</span>
          </div>

          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Phone className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Mail className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Calendar className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SortableOpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: opportunity.id.toString(),
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <OpportunityCard
        opportunity={opportunity}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

function KanbanColumn({ column, opportunities }: { column: Column; opportunities: Opportunity[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: getColumnDropId(column.id),
  })

  const avgValue =
    opportunities.length > 0
      ? Math.round(opportunities.reduce((sum, item) => sum + Number(item.value || 0), 0) / opportunities.length)
      : 0

  return (
    <div className="flex-1 min-w-80">
      <Card className={`bg-muted/20 transition-colors ${isOver ? "ring-2 ring-primary/30 bg-primary/5" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${column.color}`} />
            <h3 className="font-semibold">{column.title}</h3>
            <Badge variant="default" className="ml-auto">
              {opportunities.length}
            </Badge>
          </div>

          <div className="space-y-1 mb-4">
            <p className="text-xs text-muted-foreground">Valor promedio: {avgValue}</p>
          </div>

          <SortableContext items={opportunities.map((item) => item.id.toString())} strategy={verticalListSortingStrategy}>
            <div
              ref={setNodeRef}
              className={`space-y-2 min-h-96 rounded-md border border-transparent transition-colors ${
                isOver ? "bg-primary/5 border-primary/30" : ""
              }`}
            >
              {opportunities.map((opportunity) => (
                <SortableOpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}

              {opportunities.length === 0 && (
                <div className={`flex items-center justify-center h-32 text-sm rounded-md border border-dashed ${
                  isOver ? "border-primary/40 text-primary" : "border-border text-muted-foreground"
                }`}>
                  No hay oportunidades en esta etapa
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
  const [columns, setColumns] = useState<Column[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeOpportunityId, setActiveOpportunityId] = useState<number | null>(null)
  const { addToast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    fetchPipelineData()
  }, [])

  const fetchPipelineData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [stages, opportunities] = await Promise.all([
        getPipelineStages(),
        getOpportunities(),
      ])

      const normalizedStageIds = new Set(stages.map((stage: PipelineStage) => Number(stage.id)))
      const normalizedOpportunities = opportunities.map((opportunity: Opportunity) => ({
        ...opportunity,
        pipeline_stage_id: toStageId(opportunity.pipeline_stage_id),
      }))

      const columnsData: Column[] = stages.map((stage: PipelineStage, index: number) => {
        const stageId = Number(stage.id)
        const stageOpportunities = normalizedOpportunities.filter(
          (opportunity: Opportunity) => opportunity.pipeline_stage_id === stageId
        )

        const colors = ["bg-blue-500", "bg-yellow-500", "bg-orange-500", "bg-green-500", "bg-purple-500"]

        return {
          id: stage.id,
          title: stage.name,
          opportunities: stageOpportunities,
          color: colors[index % colors.length],
        }
      })

      const unassignedOpportunities = normalizedOpportunities.filter(
        (opportunity: Opportunity) =>
          opportunity.pipeline_stage_id === null || !normalizedStageIds.has(opportunity.pipeline_stage_id)
      )

      if (unassignedOpportunities.length > 0 || columnsData.length === 0) {
        columnsData.unshift({
          id: 0,
          title: "Sin asignar",
          opportunities: unassignedOpportunities,
          color: "bg-gray-500",
        })
      }

      setColumns(columnsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const totalOpportunities = columns.reduce((sum, col) => sum + col.opportunities.length, 0)
  const avgValue =
    totalOpportunities > 0
      ? Math.round(
          columns.reduce(
            (sum, col) => sum + col.opportunities.reduce((colSum, item) => colSum + Number(item.value || 0), 0),
            0
          ) / totalOpportunities
        )
      : 0

  const activeOpportunity =
    activeOpportunityId === null
      ? null
      : columns.flatMap((column) => column.opportunities).find((item) => item.id === activeOpportunityId) ?? null

  function handleDragStart(event: DragStartEvent) {
    setActiveOpportunityId(parseInt(String(event.active.id), 10))
  }

  function handleDragCancel(_event: DragCancelEvent) {
    setActiveOpportunityId(null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveOpportunityId(null)

    if (!over) return

    const activeId = parseInt(active.id as string)
    const overId = String(over.id)
    const destinationColumnId = overId.startsWith("column-")
      ? parseInt(overId.replace("column-", ""))
      : undefined

    const sourceColumn = columns.find((col) => col.opportunities.some((item) => item.id === activeId))
    const destColumn = columns.find(
      (col) =>
        col.id === destinationColumnId ||
        col.opportunities.some((item) => item.id === parseInt(overId))
    )

    if (!sourceColumn || !destColumn) return

    const sourceOpportunity = sourceColumn.opportunities.find((item) => item.id === activeId)
    if (!sourceOpportunity) return

    if (sourceColumn.id !== destColumn.id) {
      try {
        await updateOpportunityStage(activeId, destColumn.id === 0 ? null : destColumn.id)

        setColumns((prevColumns) =>
          prevColumns.map((col) => {
            if (col.id === sourceColumn.id) {
              return {
                ...col,
                opportunities: col.opportunities.filter((item) => item.id !== activeId),
              }
            }

            if (col.id === destColumn.id) {
              return {
                ...col,
                opportunities: [
                  ...col.opportunities,
                  { ...sourceOpportunity, pipeline_stage_id: destColumn.id === 0 ? null : destColumn.id },
                ],
              }
            }

            return col
          })
        )

        addToast({
          type: "success",
          title: "Oportunidad movida",
          description: `${sourceOpportunity.contact.name} movido a ${destColumn.title}`,
        })
      } catch {
        addToast({
          type: "error",
          title: "Error",
          description: "No se pudo actualizar la etapa",
        })
      }

      return
    }

    const sourceIndex = sourceColumn.opportunities.findIndex((item) => item.id === activeId)
    const destIndex = sourceColumn.opportunities.findIndex((item) => item.id === parseInt(overId))

    if (destIndex >= 0 && sourceIndex !== destIndex) {
      setColumns((prevColumns) =>
        prevColumns.map((col) => {
          if (col.id !== sourceColumn.id) return col
          return {
            ...col,
            opportunities: arrayMove(col.opportunities, sourceIndex, destIndex),
          }
        })
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchPipelineData} variant="outline">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalOpportunities}</div>
            <p className="text-sm text-muted-foreground">Total oportunidades</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{avgValue}</div>
            <p className="text-sm text-muted-foreground">Valor promedio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{columns.length}</div>
            <p className="text-sm text-muted-foreground">Etapas del pipeline</p>
          </CardContent>
        </Card>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={(args) => {
          const pointerIntersections = pointerWithin(args)
          if (pointerIntersections.length > 0) {
            return pointerIntersections
          }

          return closestCenter(args)
        }}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn key={column.id} column={column} opportunities={column.opportunities} />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeOpportunity ? <OpportunityCard opportunity={activeOpportunity} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
