import { SidebarLayout } from "@/components/SidebarLayout"
import { TaskStats } from "@/components/task-stats"
import { TaskFilters } from "@/components/task-filters"
import { TaskList } from "@/components/task-list"
import { CreateTaskDialog } from "@/components/create-task-dialog"
import { Button } from "@/components/ui/button"
import { Search, Calendar, List, Grid, CheckSquare } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function TareasPage() {
  return (
    <SidebarLayout>
      {/* Header */}
      <header className="border-b border-border bg-card">
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
              <Input placeholder="Buscar tareas..." className="pl-10 w-48" />
            </div>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Calendar className="w-4 h-4" />
              Calendario
            </Button>
            <div className="flex border border-border rounded-md">
              <Button variant="ghost" size="sm" className="rounded-r-none">
                <List className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="rounded-l-none border-l">
                <Grid className="w-4 h-4" />
              </Button>
            </div>
            <CreateTaskDialog />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-4 bg-background">
        {/* Stats */}
        <TaskStats />

        {/* Filters */}
        <TaskFilters />

        {/* Task List */}
        <TaskList />
      </div>
    </SidebarLayout>
  )
}
