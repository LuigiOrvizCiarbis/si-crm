"use client"

import { useState, useEffect } from "react"
import { SidebarLayout } from "@/components/sidebar-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, List, LayoutGrid, GanttChart, CalendarIcon, Filter, CheckSquare } from "lucide-react"
import { TaskListView } from "@/components/tasks/TaskListView"
import { TaskKanbanView } from "@/components/tasks/TaskKanbanView"
import { TaskGanttView } from "@/components/tasks/TaskGanttView"
import { TaskCalendarView } from "@/components/tasks/TaskCalendarView"
import { NewTaskModal } from "@/components/tasks/NewTaskModal"
import {
  allTasks,
  getOverdueTasks,
  getTasksDueToday,
  getTasksDueThisWeek,
  getCompletedTasksLast7Days,
  getOnTimePercentage,
} from "@/lib/data/tasks"
import type { Task } from "@/lib/types/task"

export default function TareasPage() {
  const [activeView, setActiveView] = useState("lista")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredTasks, setFilteredTasks] = useState(allTasks)
  const [showNewTask, setShowNewTask] = useState(false)

  useEffect(() => {
    const filtered = allTasks.filter((task) => task.name.toLowerCase().includes(searchQuery.toLowerCase()))
    setFilteredTasks(filtered)
  }, [searchQuery])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // N for new task
      if (e.key === "n" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault()
          setShowNewTask(true)
        }
      }
      // / for search focus
      if (e.key === "/") {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('[placeholder="Buscar tareas..."]')?.focus()
      }
      // L for Lista
      if (e.key === "l" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          setActiveView("lista")
        }
      }
      // K for Kanban
      if (e.key === "k" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          setActiveView("kanban")
        }
      }
      // G for Gantt
      if (e.key === "g" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          setActiveView("gantt")
        }
      }
      // C for Calendario
      if (e.key === "c" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          setActiveView("calendario")
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [])

  const handleCreateTask = (task: Partial<Task>) => {
    // Mock creation
    setFilteredTasks([...filteredTasks, task as Task])
  }

  const overdueTasks = getOverdueTasks()
  const todayTasks = getTasksDueToday()
  const weekTasks = getTasksDueThisWeek()
  const completedLast7Days = getCompletedTasksLast7Days()
  const onTimePercentage = getOnTimePercentage()

  return (
    <SidebarLayout>
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-6 h-6 text-emerald-500" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Gestión de Tareas</h1>
              <p className="text-sm text-muted-foreground">Organiza y da seguimiento a tus actividades</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tareas..."
                className="pl-10 w-64 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
            <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90" onClick={() => setShowNewTask(true)}>
              <Plus className="w-4 h-4" />
              Nueva tarea (N)
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <div className="px-4 pb-3 flex gap-2">
          <Badge variant="outline" className="text-xs gap-1 bg-red-500/10 text-red-400 border-red-500/30">
            <span className="font-bold">{overdueTasks.length}</span> Vencidas
          </Badge>
          <Badge variant="outline" className="text-xs gap-1 bg-orange-500/10 text-orange-400 border-orange-500/30">
            <span className="font-bold">{todayTasks.length}</span> Para hoy
          </Badge>
          <Badge variant="outline" className="text-xs gap-1 bg-blue-500/10 text-blue-400 border-blue-500/30">
            <span className="font-bold">{weekTasks.length}</span> Esta semana
          </Badge>
          <Badge variant="outline" className="text-xs gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
            <span className="font-bold">{completedLast7Days.length}</span> Hechas (últimos 7 días)
          </Badge>
          <Badge variant="outline" className="text-xs gap-1 bg-purple-500/10 text-purple-400 border-purple-500/30">
            <span className="font-bold">{onTimePercentage}%</span> A tiempo
          </Badge>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-4 bg-background">
        <Tabs value={activeView} onValueChange={setActiveView}>
          <TabsList className="grid w-full max-w-md grid-cols-4 bg-muted">
            <TabsTrigger value="lista" className="gap-2">
              <List className="w-4 h-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="gantt" className="gap-2">
              <GanttChart className="w-4 h-4" />
              Gantt
            </TabsTrigger>
            <TabsTrigger value="calendario" className="gap-2">
              <CalendarIcon className="w-4 h-4" />
              Calendario
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="mt-4">
            <TaskListView tasks={filteredTasks} />
          </TabsContent>

          <TabsContent value="kanban" className="mt-4">
            <TaskKanbanView tasks={filteredTasks} />
          </TabsContent>

          <TabsContent value="gantt" className="mt-4">
            <TaskGanttView tasks={filteredTasks} />
          </TabsContent>

          <TabsContent value="calendario" className="mt-4">
            <TaskCalendarView tasks={filteredTasks} />
          </TabsContent>
        </Tabs>
      </div>

      {/* New Task Modal */}
      <NewTaskModal open={showNewTask} onOpenChange={setShowNewTask} onCreateTask={handleCreateTask} />
    </SidebarLayout>
  )
}
