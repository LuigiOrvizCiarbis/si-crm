"use client"

import { useState } from "react"
import { KanbanBoard } from "@/components/kanban-board"
import { SidebarLayout } from "@/components/SidebarLayout"
import { PipelineCompactHeader } from "@/components/pipeline-compact-header"
import { useToast } from "@/components/Toast"

export default function OportunidadesPage() {
  const { addToast } = useToast()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleNewOpportunity = (): void => {
    addToast({
      type: "success",
      title: "Nueva oportunidad creada",
      description: "Oportunidad agregada al pipeline",
    })
    setRefreshKey((prev) => prev + 1)
  }

  const handleStagesChanged = (): void => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <SidebarLayout>
      <PipelineCompactHeader
        onNewOpportunity={handleNewOpportunity}
        onStagesChanged={handleStagesChanged}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 md:px-6 lg:px-8 py-6 space-y-6">
          <KanbanBoard refreshKey={refreshKey} />
        </div>
      </div>
    </SidebarLayout>
  )
}
