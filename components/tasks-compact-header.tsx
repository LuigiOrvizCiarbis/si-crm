"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NotificationsBell } from "@/components/notifications-bell"
import { Search, Filter, List, LayoutGrid, GanttChart, CalendarIcon } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface TasksCompactHeaderProps {
  activeView: string
  onViewChange: (view: string) => void
  onSearch?: (query: string) => void
  onNewTask?: () => void
  onFilterClick?: () => void
}

export function TasksCompactHeader({
  activeView,
  onViewChange,
  onSearch,
  onNewTask,
  onFilterClick,
}: TasksCompactHeaderProps) {
  const handleFilterClick = () => {
    console.log("[v0] Filters button clicked!")
    onFilterClick?.()
  }

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="h-[80px] px-4 md:px-6 flex items-center gap-3">
        {/* Left: Title only (no subtitle) */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl">✔</span>
          <h1 className="text-lg font-semibold tracking-tight">Gestión de Tareas</h1>
        </div>

        {/* Center: Search input (flexible width) */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar tareas..." className="pl-9 h-9" onChange={(e) => onSearch?.(e.target.value)} />
        </div>

        {/* View switcher (Lista | Kanban | Gantt | Calendario) */}
        <div className="hidden lg:block shrink-0">
          <ToggleGroup type="single" value={activeView} onValueChange={onViewChange} className="gap-1">
            <ToggleGroupItem value="lista" size="sm" className="gap-1.5">
              <List className="w-4 h-4" />
              Lista
            </ToggleGroupItem>
            <ToggleGroupItem value="kanban" size="sm" className="gap-1.5">
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </ToggleGroupItem>
            <ToggleGroupItem value="gantt" size="sm" className="gap-1.5">
              <GanttChart className="w-4 h-4" />
              Gantt
            </ToggleGroupItem>
            <ToggleGroupItem value="calendario" size="sm" className="gap-1.5">
              <CalendarIcon className="w-4 h-4" />
              Calendario
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Right: Filters + CTA + Notifications */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Filters button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleFilterClick}
            className="gap-2 bg-transparent"
            type="button"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden md:inline">Filtros</span>
          </Button>

          {/* CTA primary with keyboard shortcut hint */}
          <Button size="sm" onClick={onNewTask} className="shrink-0 gap-2">
            + Nueva tarea
            <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              N
            </kbd>
          </Button>

          {/* Notifications bell */}
          <NotificationsBell />
        </div>
      </div>
    </div>
  )
}
