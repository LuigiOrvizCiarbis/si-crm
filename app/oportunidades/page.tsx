"use client"

import { KanbanBoard } from "@/components/kanban-board"
import { SidebarLayout } from "@/components/sidebar-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NotificationsBell } from "@/components/notifications-bell"
import { useToast } from "@/components/Toast"
import { useAppStore } from "@/store/useAppStore"
import { Plus, Filter, Search } from "lucide-react"

export default function OportunidadesPage() {
  const { addToast } = useToast()
  const { filters, setFilters } = useAppStore()

  const handleNewOpportunity = () => {
    addToast({
      type: "success",
      title: "Nueva oportunidad creada",
      description: "Oportunidad agregada al pipeline",
    })
  }

  return (
    <SidebarLayout>
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-start justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pipeline de Oportunidades</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestiona tus leads a través del embudo de ventas</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleNewOpportunity} className="gap-2">
              <Plus className="w-4 h-4" />
              Nueva oportunidad
            </Button>
            <NotificationsBell />
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 pb-4 bg-card">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar leads..." className="pl-10" />
          </div>

          <Select value={filters.canal} onValueChange={(value) => setFilters({ canal: value })}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los canales</SelectItem>
              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
              <SelectItem value="Instagram">Instagram</SelectItem>
              <SelectItem value="Web">Web</SelectItem>
              <SelectItem value="Email">Email</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.owner} onValueChange={(value) => setFilters({ owner: value })}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Vendedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Juan Pérez">Juan Pérez</SelectItem>
              <SelectItem value="Ana López">Ana López</SelectItem>
              <SelectItem value="Carlos Ruiz">Carlos Ruiz</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            Más filtros
          </Button>
        </div>
      </div>

      {/* Pipeline Content */}
      <div className="p-6">
        <KanbanBoard />
      </div>
    </SidebarLayout>
  )
}
