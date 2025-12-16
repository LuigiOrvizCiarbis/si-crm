"use client"

import { useState, useEffect } from "react"
import { SidebarLayout } from "@/components/sidebar-layout"
import { TasksCompactHeader } from "@/components/tasks-compact-header"
import { Badge } from "@/components/ui/badge"
import { TaskListView } from "@/components/tasks/TaskListView"
import { TaskKanbanView } from "@/components/tasks/TaskKanbanView"
import { TaskGanttView } from "@/components/tasks/TaskGanttView"
import { TaskCalendarView } from "@/components/tasks/TaskCalendarView"
import { NewTaskModal } from "@/components/tasks/NewTaskModal"
import { TasksFilterPanel, type TaskFilters } from "@/components/tasks/TasksFilterPanel"
import { useTaskStore } from "@/store/useTaskStore"
import type { Task } from "@/lib/types/task"
import { useIsMobile } from "@/hooks/use-mobile"

export default function TareasPage() {
  const tasks = useTaskStore((state) => state.tasks)
  const [activeView, setActiveView] = useState("lista")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredTasks, setFilteredTasks] = useState(tasks)
  const [showNewTask, setShowNewTask] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<TaskFilters>({
    status: [],
    assignees: [],
    types: [],
    deadline: null,
  })
  const isMobile = useIsMobile()

  useEffect(() => {
    let filtered = tasks

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter((task) => task.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Apply status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter((task) => filters.status.includes(task.status))
    }

    // Apply assignee filter
    if (filters.assignees.length > 0) {
      filtered = filtered.filter((task) => filters.assignees.includes(task.assignee))
    }

    // Apply type filter
    if (filters.types.length > 0) {
      filtered = filtered.filter((task) => filters.types.includes(task.type))
    }

    // Apply deadline filter
    if (filters.deadline) {
      const now = new Date()
      const today = now.toISOString().split("T")[0]
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      filtered = filtered.filter((task) => {
        if (filters.deadline === "overdue") {
          return (
            task.deadline && new Date(task.deadline) < now && task.status !== "hecho" && task.status !== "cancelado"
          )
        }
        if (filters.deadline === "today") {
          return task.deadline?.startsWith(today) && task.status !== "hecho"
        }
        if (filters.deadline === "this-week") {
          if (!task.deadline || task.status === "hecho" || task.status === "cancelado") return false
          const deadline = new Date(task.deadline)
          return deadline >= now && deadline <= weekFromNow
        }
        if (filters.deadline === "next-7-days") {
          if (!task.deadline || task.status === "hecho" || task.status === "cancelado") return false
          const deadline = new Date(task.deadline)
          const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          return deadline >= now && deadline <= next7Days
        }
        if (filters.deadline === "no-date") {
          return !task.deadline
        }
        return true
      })
    }

    setFilteredTasks(filtered)
  }, [searchQuery, filters, tasks])

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
    console.log("[v0] Task created:", task)
  }

  const overdueTasks = tasks.filter((task) => {
    const deadline = new Date(task.deadline)
    return deadline < new Date() && task.status !== "hecho" && task.status !== "cancelado"
  })

  const todayTasks = tasks.filter((task) => {
    const today = new Date().toISOString().split("T")[0]
    return task.deadline?.startsWith(today) && task.status !== "hecho"
  })

  const weekTasks = tasks.filter((task) => {
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const deadline = new Date(task.deadline)
    return deadline >= now && deadline <= weekFromNow && task.status !== "hecho" && task.status !== "cancelado"
  })

  const completedLast7Days = tasks.filter((task) => {
    const now = new Date()
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return task.status === "hecho" && new Date(task.completedAt) >= last7Days
  })

  const onTimePercentage = (() => {
    const totalTasks = tasks.length
    const onTimeTasks = tasks.filter((task) => {
      const deadline = new Date(task.deadline)
      return deadline >= new Date() || task.status === "hecho"
    }).length
    return totalTasks > 0 ? ((onTimeTasks / totalTasks) * 100).toFixed(0) : "0"
  })()

  return (
    <SidebarLayout>
      <TasksCompactHeader
        activeView={activeView}
        onViewChange={setActiveView}
        onSearch={setSearchQuery}
        onNewTask={() => setShowNewTask(true)}
        onFilterClick={() => setShowFilters(!showFilters)}
      />

      <div className="flex gap-2 px-6 py-3 border-b border-border/50 bg-card">
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

      <div className="flex-1 overflow-y-auto p-6">
        {activeView === "lista" && <TaskListView tasks={filteredTasks} />}
        {activeView === "kanban" && <TaskKanbanView tasks={filteredTasks} />}
        {activeView === "gantt" && <TaskGanttView tasks={filteredTasks} />}
        {activeView === "calendario" && <TaskCalendarView tasks={filteredTasks} />}
      </div>

      {/* New Task Modal */}
      <NewTaskModal open={showNewTask} onOpenChange={setShowNewTask} onCreateTask={handleCreateTask} />

      <TasksFilterPanel
        open={showFilters}
        onOpenChange={setShowFilters}
        filters={filters}
        onFiltersChange={setFilters}
        isMobile={isMobile}
      />
    </SidebarLayout>
  )
}
