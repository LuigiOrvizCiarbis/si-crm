"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge, LeadScoreBadge } from "@/components/Badges"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/Toast"
import { Phone, Mail, Calendar, GripVertical, TrendingUp, Clock, Loader2 } from "lucide-react"
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
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface Conversation {
  id: number
  contact: {
    id: string
    name: string
    phone: string
  }
  channel: {
    id: number
    name: string
    type: number
  }
  last_message: string
  last_message_at: string
  lead_score: number | null
  pipeline_stage_id: number | null
  unread_count: number
}

interface PipelineStage {
  id: number
  name: string
  sort_order: number
}

interface Column {
  id: number
  title: string
  conversations: Conversation[]
  color: string
}

const getChannelIcon = (channelType: number) => {
  switch (channelType) {
    case 1: return "📱" // WhatsApp
    case 2: return "📸" // Instagram
    case 3: return "👍" // Facebook
    default: return "💬"
  }
}

const getChannelColor = (channelType: number) => {
  switch (channelType) {
    case 1: return "bg-green-500/10 text-green-600"
    case 2: return "bg-pink-500/10 text-pink-600"
    case 3: return "bg-blue-500/10 text-blue-600"
    default: return "bg-gray-500/10 text-gray-600"
  }
}

function SortableConversationCard({ conversation }: { conversation: Conversation }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: conversation.id.toString(),
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const lastContactText = conversation.last_message_at 
    ? formatDistanceToNow(new Date(conversation.last_message_at), { locale: es, addSuffix: true })
    : "Sin mensajes"

  const initials = conversation.contact.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)

  return (
    <Card ref={setNodeRef} style={style} className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm truncate">{conversation.contact.name}</h4>
              <p className="text-xs text-muted-foreground truncate">{conversation.contact.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {conversation.lead_score && <LeadScoreBadge score={conversation.lead_score} />}
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
            <span className={`text-xs px-2 py-1 rounded ${getChannelColor(conversation.channel.type)}`}>
              {getChannelIcon(conversation.channel.type)} {conversation.channel.name}
            </span>
            {conversation.unread_count > 0 && (
              <Badge variant="error" className="text-xs h-5">
                {conversation.unread_count}
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2">
            {conversation.last_message || "Sin mensajes"}
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{lastContactText}</span>
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

function KanbanColumn({ column, conversations }: { column: Column; conversations: Conversation[] }) {
  const avgLeadScore =
    conversations.length > 0
      ? Math.round(
          conversations.reduce((sum, conv) => sum + (conv.lead_score || 0), 0) / conversations.length
        )
      : 0

  return (
    <div className="flex-1 min-w-80">
      <Card className="bg-muted/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${column.color}`} />
            <h3 className="font-semibold">{column.title}</h3>
            <Badge variant="default" className="ml-auto">
              {conversations.length}
            </Badge>
          </div>

          <div className="space-y-1 mb-4">
            <p className="text-xs text-muted-foreground">Lead Score promedio: {avgLeadScore}</p>
          </div>

          <SortableContext items={conversations.map((conv) => conv.id.toString())} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 min-h-96">
              {conversations.map((conversation) => (
                <SortableConversationCard key={conversation.id} conversation={conversation} />
              ))}

              {conversations.length === 0 && (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  No hay conversaciones en esta etapa
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
  const { addToast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor),
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
      // Fetch stages and conversations in parallel
      const [stagesResponse, conversationsResponse] = await Promise.all([
        fetch("/api/pipeline-stages"),
        fetch("/api/conversations?per_page=100"),
      ])

      if (!stagesResponse.ok || !conversationsResponse.ok) {
        throw new Error("Error al cargar datos del pipeline")
      }

      const stages: PipelineStage[] = await stagesResponse.json()
      const conversationsData = await conversationsResponse.json()
      const conversations: Conversation[] = conversationsData.data || []

      // Group conversations by stage
      const columnsData: Column[] = stages.map((stage, index) => {
        const stageConversations = conversations.filter(
          (conv) => conv.pipeline_stage_id === stage.id
        )

        // Assign colors based on order
        const colors = ["bg-blue-500", "bg-yellow-500", "bg-orange-500", "bg-green-500", "bg-purple-500"]
        const color = colors[index % colors.length]

        return {
          id: stage.id,
          title: stage.name,
          conversations: stageConversations,
          color,
        }
      })

      // Add column for conversations without stage
      const unassignedConversations = conversations.filter((conv) => !conv.pipeline_stage_id)
      if (unassignedConversations.length > 0 || columnsData.length === 0) {
        columnsData.unshift({
          id: 0,
          title: "Sin asignar",
          conversations: unassignedConversations,
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

  const totalConversations = columns.reduce((sum, col) => sum + col.conversations.length, 0)
  const avgLeadScore =
    totalConversations > 0
      ? Math.round(
          columns.reduce(
            (sum, col) =>
              sum + col.conversations.reduce((colSum, conv) => colSum + (conv.lead_score || 0), 0),
            0
          ) / totalConversations
        )
      : 0

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over) return

    const activeId = parseInt(active.id as string)
    const overId = over.id

    // Find source and destination columns
    const sourceColumn = columns.find((col) => col.conversations.some((conv) => conv.id === activeId))
    const destColumn = columns.find(
      (col) => col.id === overId || col.conversations.some((conv) => conv.id === parseInt(overId as string))
    )

    if (!sourceColumn || !destColumn) return

    const sourceConversation = sourceColumn.conversations.find((conv) => conv.id === activeId)
    if (!sourceConversation) return

    if (sourceColumn.id !== destColumn.id) {
      // Moving between columns - update backend
      try {
        const response = await fetch(`/api/conversations/${activeId}/stage`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pipeline_stage_id: destColumn.id === 0 ? null : destColumn.id }),
        })

        if (!response.ok) throw new Error("Error al actualizar etapa")

        // Update local state
        setColumns((prevColumns) => {
          return prevColumns.map((col) => {
            if (col.id === sourceColumn.id) {
              return {
                ...col,
                conversations: col.conversations.filter((conv) => conv.id !== activeId),
              }
            }
            if (col.id === destColumn.id) {
              const updatedConversation = {
                ...sourceConversation,
                pipeline_stage_id: destColumn.id === 0 ? null : destColumn.id,
              }
              return {
                ...col,
                conversations: [...col.conversations, updatedConversation],
              }
            }
            return col
          })
        })

        addToast({
          type: "success",
          title: "Conversación movida",
          description: `${sourceConversation.contact.name} movido a ${destColumn.title}`,
        })
      } catch (error) {
        addToast({
          type: "error",
          title: "Error",
          description: "No se pudo actualizar la etapa",
        })
      }
    } else {
      // Reordering within same column
      const sourceIndex = sourceColumn.conversations.findIndex((conv) => conv.id === activeId)
      const destIndex = sourceColumn.conversations.findIndex((conv) => conv.id === parseInt(overId as string))

      if (sourceIndex !== destIndex) {
        setColumns((prevColumns) => {
          return prevColumns.map((col) => {
            if (col.id === sourceColumn.id) {
              const newConversations = arrayMove(col.conversations, sourceIndex, destIndex)
              return { ...col, conversations: newConversations }
            }
            return col
          })
        })
      }
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
            <div className="text-2xl font-bold">{totalConversations}</div>
            <p className="text-sm text-muted-foreground">Total conversaciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{avgLeadScore}</div>
            <p className="text-sm text-muted-foreground">Lead Score promedio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{columns.length}</div>
            <p className="text-sm text-muted-foreground">Etapas del pipeline</p>
          </CardContent>
        </Card>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn key={column.id} column={column} conversations={column.conversations} />
          ))}
        </div>
      </DndContext>
    </div>
  )
}
