"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ZoomIn, ZoomOut, Calendar } from "lucide-react"
import type { Task } from "@/lib/types/task"
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  differenceInDays,
  startOfMonth,
  endOfMonth,
} from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

type ZoomLevel = "day" | "week" | "month"

const priorityColors = {
  baja: "bg-gray-500",
  media: "bg-blue-500",
  alta: "bg-orange-500",
  critica: "bg-red-500",
}

export function TaskGanttView({ tasks }: { tasks: Task[] }) {
  const [zoom, setZoom] = useState<ZoomLevel>("week")
  const [localTasks, setLocalTasks] = useState(tasks)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null)

  // Calculate date range
  const today = new Date()
  const startDate = startOfWeek(addDays(today, -7))
  const endDate = endOfWeek(addDays(today, 30))

  const getDaysInRange = () => {
    if (zoom === "day") {
      return eachDayOfInterval({ start: startDate, end: endDate })
    } else if (zoom === "week") {
      const weeks = []
      let current = startDate
      while (current <= endDate) {
        weeks.push(current)
        current = addDays(current, 7)
      }
      return weeks
    } else {
      const months = []
      let current = startOfMonth(startDate)
      while (current <= endOfMonth(endDate)) {
        months.push(current)
        current = addDays(current, 30)
      }
      return months
    }
  }

  const dateColumns = getDaysInRange()
  const columnWidth = zoom === "day" ? 60 : zoom === "week" ? 100 : 120

  const getTaskPosition = (task: Task) => {
    if (!task.deadline) return null

    const taskDate = new Date(task.deadline)
    const daysDiff = differenceInDays(taskDate, startDate)
    const left = daysDiff * (columnWidth / (zoom === "day" ? 1 : zoom === "week" ? 7 : 30))

    return {
      left: Math.max(0, left),
      width: columnWidth,
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setEditingTask({ ...task })
  }

  const handleSaveTask = () => {
    if (!selectedTask || !editingTask) return

    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === selectedTask.id
          ? {
              ...t,
              ...editingTask,
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    )

    toast.success("Tarea actualizada")
    setSelectedTask(null)
    setEditingTask(null)
  }

  const handleChecklistToggle = (checklistId: string) => {
    if (!editingTask) return

    setEditingTask({
      ...editingTask,
      checklist: editingTask.checklist?.map((item) => (item.id === checklistId ? { ...item, done: !item.done } : item)),
    })
  }

  const tasksWithDeadlines = localTasks.filter((t) => t.deadline && t.status !== "hecho" && t.status !== "cancelado")

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom("day")}
            className={zoom === "day" ? "bg-primary/10" : ""}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Día
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom("week")}
            className={zoom === "week" ? "bg-primary/10" : ""}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Semana
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom("month")}
            className={zoom === "month" ? "bg-primary/10" : ""}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Mes
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setZoom("day")}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setZoom("month")}>
            <ZoomOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Header */}
            <div className="flex border-b border-border bg-muted/50 sticky top-0 z-10">
              <div className="w-64 p-3 font-semibold text-sm border-r border-border flex-shrink-0">Tarea</div>
              <div className="flex">
                {dateColumns.map((date, idx) => (
                  <div
                    key={idx}
                    className="p-3 text-center border-r border-border text-xs font-medium"
                    style={{ minWidth: columnWidth }}
                  >
                    {zoom === "day" && format(date, "EEE dd", { locale: es })}
                    {zoom === "week" && format(date, "dd MMM", { locale: es })}
                    {zoom === "month" && format(date, "MMM yyyy", { locale: es })}
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks */}
            <div className="relative">
              {tasksWithDeadlines.map((task, taskIdx) => {
                const position = getTaskPosition(task)
                if (!position) return null

                const hasDependencies = task.dependsOn.length > 0
                const hasUnfinishedDeps = task.dependsOn.some((depId) => {
                  const depTask = localTasks.find((t) => t.id === depId)
                  return depTask && depTask.status !== "hecho"
                })

                return (
                  <div key={task.id} className="flex border-b border-border/50 hover:bg-muted/20 relative">
                    {/* Task Name */}
                    <div className="w-64 p-3 flex items-center gap-2 border-r border-border flex-shrink-0">
                      <span className="text-sm text-foreground truncate">{task.name}</span>
                      {hasDependencies && hasUnfinishedDeps && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                        >
                          Bloqueado
                        </Badge>
                      )}
                    </div>

                    {/* Timeline */}
                    <div className="relative flex-1" style={{ height: 48 }}>
                      <div
                        className={`absolute top-2 h-8 rounded cursor-pointer transition-all hover:opacity-80 flex items-center px-2 ${priorityColors[task.priority]}/80 hover:${priorityColors[task.priority]}`}
                        style={{
                          left: position.left,
                          width: position.width,
                        }}
                        onClick={() => handleTaskClick(task)}
                      >
                        <span className="text-xs text-white font-medium truncate">{task.assignee}</span>
                      </div>

                      {/* Dependency indicators */}
                      {hasDependencies && (
                        <div
                          className="absolute left-2 top-4 w-1 h-1 rounded-full bg-yellow-400"
                          title="Tiene dependencias"
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Today marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-20"
              style={{
                left:
                  264 +
                  differenceInDays(today, startDate) * (columnWidth / (zoom === "day" ? 1 : zoom === "week" ? 7 : 30)),
              }}
            >
              <div className="absolute -top-8 -left-8 text-xs text-red-500 font-semibold whitespace-nowrap">Hoy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Panel */}
      <Sheet open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Tarea</SheetTitle>
          </SheetHeader>

          {editingTask && (
            <div className="space-y-4 mt-6">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={editingTask.name || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Estado</Label>
                  <Select
                    value={editingTask.status}
                    onValueChange={(val) => setEditingTask({ ...editingTask, status: val as Task["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nuevo">Nuevo</SelectItem>
                      <SelectItem value="en-curso">En curso</SelectItem>
                      <SelectItem value="en-espera">En espera</SelectItem>
                      <SelectItem value="hecho">Hecho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Prioridad</Label>
                  <Select
                    value={editingTask.priority}
                    onValueChange={(val) => setEditingTask({ ...editingTask, priority: val as Task["priority"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Responsable</Label>
                <Input
                  value={editingTask.assignee || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, assignee: e.target.value })}
                />
              </div>

              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={editingTask.description || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  rows={3}
                />
              </div>

              {editingTask.checklist && editingTask.checklist.length > 0 && (
                <div>
                  <Label>Checklist</Label>
                  <div className="space-y-2 mt-2">
                    {editingTask.checklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <Checkbox checked={item.done} onCheckedChange={() => handleChecklistToggle(item.id)} />
                        <span
                          className={`text-sm ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}
                        >
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveTask} className="flex-1">
                  Guardar cambios
                </Button>
                <Button variant="outline" onClick={() => setSelectedTask(null)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
