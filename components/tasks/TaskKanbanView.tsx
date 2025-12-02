"use client"

import { useState } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Phone, Video, FileText, MapPin, HeadphonesIcon, CalendarIcon, AlertTriangle } from "lucide-react"
import type { Task } from "@/lib/types/task"
import { format } from "date-fns"
import { toast } from "sonner"

const taskTypeIcons = {
  reunion: Video,
  llamado: Phone,
  demo: Video,
  propuesta: FileText,
  visita: MapPin,
  seguimiento: CalendarIcon,
  soporte: HeadphonesIcon,
}

const statusColors = {
  nuevo: "bg-blue-500/10 border-blue-500/30",
  "en-curso": "bg-yellow-500/10 border-yellow-500/30",
  "en-espera": "bg-orange-500/10 border-orange-500/30",
  reprogramado: "bg-purple-500/10 border-purple-500/30",
  bloqueado: "bg-red-500/10 border-red-500/30",
  hecho: "bg-emerald-500/10 border-emerald-500/30",
  cancelado: "bg-gray-500/10 border-gray-500/30",
}

const priorityColors = {
  baja: "bg-gray-500/20 text-gray-300",
  media: "bg-blue-500/20 text-blue-300",
  alta: "bg-orange-500/20 text-orange-300",
  critica: "bg-red-500/20 text-red-300",
}

type GroupBy = "status" | "priority" | "type"

interface TaskCardProps {
  task: Task
  onMarkDone: (taskId: string) => void
}

function TaskCard({ task, onMarkDone }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const TypeIcon = taskTypeIcons[task.type]
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "hecho"

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="p-3 mb-2 hover:shadow-md transition-shadow cursor-move bg-card border border-border">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1">
            <TypeIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium text-foreground line-clamp-2">{task.name}</span>
          </div>
          <Checkbox
            checked={task.status === "hecho"}
            onCheckedChange={() => onMarkDone(task.id)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                {task.assignee
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{task.assignee}</span>
          </div>

          <Badge variant="outline" className={`text-xs ${priorityColors[task.priority]}`}>
            {task.priority.charAt(0).toUpperCase()}
          </Badge>
        </div>

        {task.deadline && (
          <div
            className={`flex items-center gap-1 mt-2 text-xs ${isOverdue ? "text-red-400 font-semibold" : "text-muted-foreground"}`}
          >
            {isOverdue && <AlertTriangle className="w-3 h-3" />}
            <CalendarIcon className="w-3 h-3" />
            <span>{format(new Date(task.deadline), "dd/MM/yyyy")}</span>
          </div>
        )}

        {task.checklist.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            {task.checklist.filter((c) => c.done).length}/{task.checklist.length} completados
          </div>
        )}
      </Card>
    </div>
  )
}

interface KanbanColumnProps {
  title: string
  tasks: Task[]
  columnId: string
  color: string
  onMarkDone: (taskId: string) => void
}

function KanbanColumn({ title, tasks, columnId, color, onMarkDone }: KanbanColumnProps) {
  return (
    <div className="flex-shrink-0 w-80">
      <div className={`rounded-lg border ${color} p-3 mb-3`}>
        <h3 className="font-semibold text-foreground flex items-center justify-between">
          <span>{title}</span>
          <Badge variant="secondary" className="ml-2">
            {tasks.length}
          </Badge>
        </h3>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[200px]">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onMarkDone={onMarkDone} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

export function TaskKanbanView({ tasks }: { tasks: Task[] }) {
  const [groupBy, setGroupBy] = useState<GroupBy>("status")
  const [localTasks, setLocalTasks] = useState(tasks)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const activeTask = localTasks.find((t) => t.id === active.id)
    if (!activeTask) return

    // Determine new value based on groupBy
    let newValue: string | undefined
    const overColumn = over.id as string

    if (groupBy === "status") {
      newValue = overColumn
    } else if (groupBy === "priority") {
      newValue = overColumn
    } else if (groupBy === "type") {
      newValue = overColumn
    }

    if (newValue) {
      setLocalTasks((prev) =>
        prev.map((task) =>
          task.id === activeTask.id
            ? {
                ...task,
                [groupBy]: newValue,
                updatedAt: new Date().toISOString(),
              }
            : task,
        ),
      )

      toast.success(`Tarea movida a "${newValue}"`)
    }

    setActiveId(null)
  }

  const handleMarkDone = (taskId: string) => {
    setLocalTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: "hecho",
              completedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : task,
      ),
    )
    toast.success("Tarea marcada como completada")
  }

  // Group tasks based on groupBy selection
  const getColumns = () => {
    if (groupBy === "status") {
      return {
        nuevo: { title: "Nuevo", tasks: localTasks.filter((t) => t.status === "nuevo"), color: statusColors.nuevo },
        "en-curso": {
          title: "En Curso",
          tasks: localTasks.filter((t) => t.status === "en-curso"),
          color: statusColors["en-curso"],
        },
        "en-espera": {
          title: "En Espera",
          tasks: localTasks.filter((t) => t.status === "en-espera"),
          color: statusColors["en-espera"],
        },
        reprogramado: {
          title: "Reprogramado",
          tasks: localTasks.filter((t) => t.status === "reprogramado"),
          color: statusColors.reprogramado,
        },
        bloqueado: {
          title: "Bloqueado",
          tasks: localTasks.filter((t) => t.status === "bloqueado"),
          color: statusColors.bloqueado,
        },
        hecho: { title: "Hecho", tasks: localTasks.filter((t) => t.status === "hecho"), color: statusColors.hecho },
        cancelado: {
          title: "Cancelado",
          tasks: localTasks.filter((t) => t.status === "cancelado"),
          color: statusColors.cancelado,
        },
      }
    } else if (groupBy === "priority") {
      return {
        baja: {
          title: "Baja",
          tasks: localTasks.filter((t) => t.priority === "baja"),
          color: "bg-gray-500/10 border-gray-500/30",
        },
        media: {
          title: "Media",
          tasks: localTasks.filter((t) => t.priority === "media"),
          color: "bg-blue-500/10 border-blue-500/30",
        },
        alta: {
          title: "Alta",
          tasks: localTasks.filter((t) => t.priority === "alta"),
          color: "bg-orange-500/10 border-orange-500/30",
        },
        critica: {
          title: "Crítica",
          tasks: localTasks.filter((t) => t.priority === "critica"),
          color: "bg-red-500/10 border-red-500/30",
        },
      }
    } else {
      return {
        reunion: {
          title: "Reunión",
          tasks: localTasks.filter((t) => t.type === "reunion"),
          color: "bg-purple-500/10 border-purple-500/30",
        },
        llamado: {
          title: "Llamado",
          tasks: localTasks.filter((t) => t.type === "llamado"),
          color: "bg-blue-500/10 border-blue-500/30",
        },
        demo: {
          title: "Demo",
          tasks: localTasks.filter((t) => t.type === "demo"),
          color: "bg-cyan-500/10 border-cyan-500/30",
        },
        propuesta: {
          title: "Propuesta",
          tasks: localTasks.filter((t) => t.type === "propuesta"),
          color: "bg-green-500/10 border-green-500/30",
        },
        visita: {
          title: "Visita",
          tasks: localTasks.filter((t) => t.type === "visita"),
          color: "bg-orange-500/10 border-orange-500/30",
        },
        seguimiento: {
          title: "Seguimiento",
          tasks: localTasks.filter((t) => t.type === "seguimiento"),
          color: "bg-yellow-500/10 border-yellow-500/30",
        },
        soporte: {
          title: "Soporte",
          tasks: localTasks.filter((t) => t.type === "soporte"),
          color: "bg-red-500/10 border-red-500/30",
        },
      }
    }
  }

  const columns = getColumns()
  const activeTask = activeId ? localTasks.find((t) => t.id === activeId) : null

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Agrupar por:</span>
          <Select value={groupBy} onValueChange={(val) => setGroupBy(val as GroupBy)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">Estado</SelectItem>
              <SelectItem value="priority">Prioridad</SelectItem>
              <SelectItem value="type">Tipo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Object.entries(columns).map(([key, { title, tasks, color }]) => (
            <KanbanColumn
              key={key}
              columnId={key}
              title={title}
              tasks={tasks}
              color={color}
              onMarkDone={handleMarkDone}
            />
          ))}
        </div>

        <DragOverlay>{activeTask ? <TaskCard task={activeTask} onMarkDone={handleMarkDone} /> : null}</DragOverlay>
      </DndContext>
    </div>
  )
}
