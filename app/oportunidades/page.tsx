"use client"

import { KanbanBoard } from "@/components/kanban-board"
import { SidebarLayout } from "@/components/sidebar-layout"
import { useToast } from "@/components/Toast"
import { useAppStore } from "@/store/useAppStore"

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
      {/* Pipeline Content */}
      <div className="p-6">
        <KanbanBoard />
      </div>
    </SidebarLayout>
  )
}
