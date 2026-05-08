"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, CalendarIcon, Send } from "lucide-react"
import type { Task } from "@/lib/types/task"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIntegrationsModal } from "./CalendarIntegrationsModal"
import { toast } from "sonner"

type CalendarView = "month" | "week" | "day"

const priorityColors = {
  baja: "bg-gray-500/80",
  media: "bg-blue-500/80",
  alta: "bg-orange-500/80",
  critica: "bg-red-500/80",
}

export function TaskCalendarView({ tasks }: { tasks: Task[] }) {
  const [view, setView] = useState<CalendarView>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showIntegrations, setShowIntegrations] = useState(false)

  const handlePrevious = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1))
    else if (view === "week") setCurrentDate(subWeeks(currentDate, 1))
    else setCurrentDate(subDays(currentDate, 1))
  }

  const handleNext = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1))
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1))
    else setCurrentDate(addDays(currentDate, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const getDaysInView = () => {
    if (view === "month") {
      const start = startOfWeek(startOfMonth(currentDate))
      const end = endOfWeek(endOfMonth(currentDate))
      return eachDayOfInterval({ start, end })
    } else if (view === "week") {
      const start = startOfWeek(currentDate)
      const end = endOfWeek(currentDate)
      return eachDayOfInterval({ start, end })
    } else {
      return [currentDate]
    }
  }

  const getTasksForDay = (date: Date) => {
    return tasks.filter((task) => task.deadline && isSameDay(new Date(task.deadline), date))
  }

  const handleSyncTask = (provider: string) => {
    if (!selectedTask) return

    // Mock sync
    toast.success(`Tarea sincronizada con ${provider}`)
  }

  const days = getDaysInView()
  const tasksWithDeadlines = tasks.filter((t) => t.deadline)

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Hoy
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <h2 className="text-lg font-semibold text-foreground">
            {view === "month" && format(currentDate, "MMMM yyyy", { locale: es })}
            {view === "week" && `Semana del ${format(startOfWeek(currentDate), "dd MMM", { locale: es })}`}
            {view === "day" && format(currentDate, "dd MMMM yyyy", { locale: es })}
          </h2>
        </div>

        <Tabs value={view} onValueChange={(val) => setView(val as CalendarView)}>
          <TabsList>
            <TabsTrigger value="month">Mes</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="day">Día</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Calendar Grid */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        {view === "month" && (
          <div>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/50">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7">
              {days.map((day, idx) => {
                const dayTasks = getTasksForDay(day)
                const isToday = isSameDay(day, new Date())
                const isCurrentMonth = isSameMonth(day, currentDate)

                return (
                  <div
                    key={idx}
                    className={`min-h-[120px] p-2 border-r border-b border-border ${!isCurrentMonth ? "bg-muted/20" : ""} ${isToday ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-sm font-medium ${isToday ? "text-primary" : isCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {format(day, "d")}
                      </span>
                      {isToday && (
                        <Badge variant="default" className="text-xs h-5">
                          Hoy
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${priorityColors[task.priority]} text-white truncate`}
                          onClick={() => {
                            setSelectedTask(task)
                            setShowIntegrations(true)
                          }}
                        >
                          {task.name}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-xs text-muted-foreground">+{dayTasks.length - 3} más</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {view === "week" && (
          <div>
            {/* Week view */}
            <div className="grid grid-cols-7">
              {days.map((day, idx) => {
                const dayTasks = getTasksForDay(day)
                const isToday = isSameDay(day, new Date())

                return (
                  <div key={idx} className="border-r border-b border-border">
                    <div
                      className={`p-3 border-b border-border text-center ${isToday ? "bg-primary/10" : "bg-muted/30"}`}
                    >
                      <div className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                        {format(day, "EEE", { locale: es })}
                      </div>
                      <div className={`text-2xl font-bold ${isToday ? "text-primary" : "text-foreground"}`}>
                        {format(day, "d")}
                      </div>
                    </div>

                    <div className="p-2 space-y-2 min-h-[400px]">
                      {dayTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`p-2 rounded cursor-pointer hover:opacity-80 ${priorityColors[task.priority]} text-white`}
                          onClick={() => {
                            setSelectedTask(task)
                            setShowIntegrations(true)
                          }}
                        >
                          <div className="text-xs font-medium mb-1">{task.name}</div>
                          <div className="text-xs opacity-80">{task.assignee}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {view === "day" && (
          <div className="p-4">
            <div className="space-y-3">
              {getTasksForDay(currentDate).map((task) => (
                <div key={task.id} className={`p-4 rounded-lg ${priorityColors[task.priority]} text-white`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{task.name}</h4>
                      <p className="text-sm opacity-90">Responsable: {task.assignee}</p>
                      <p className="text-sm opacity-90">Tipo: {task.type}</p>
                      {task.description && <p className="text-sm mt-2 opacity-80">{task.description}</p>}
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedTask(task)
                        setShowIntegrations(true)
                      }}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Enviar a calendario
                    </Button>
                  </div>
                </div>
              ))}

              {getTasksForDay(currentDate).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No hay tareas para este día</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Calendar Integrations Modal */}
      {selectedTask && (
        <CalendarIntegrationsModal
          open={showIntegrations}
          onOpenChange={setShowIntegrations}
          taskId={selectedTask.id}
          taskName={selectedTask.name}
          onSync={handleSyncTask}
        />
      )}
    </div>
  )
}
