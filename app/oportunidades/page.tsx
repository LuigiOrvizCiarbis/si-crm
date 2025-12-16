"use client"

import { KanbanBoard } from "@/components/kanban-board"
import { SidebarLayout } from "@/components/sidebar-layout"
import { PipelineCompactHeader } from "@/components/pipeline-compact-header"
import { useToast } from "@/components/Toast"
import { useAppStore } from "@/store/useAppStore"
import { useState } from "react"

export default function OportunidadesPage() {
  const { addToast } = useToast()
  const { filters, setFilters } = useAppStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [channelFilter, setChannelFilter] = useState("all")
  const [vendedorFilter, setVendedorFilter] = useState("all")

  const handleNewOpportunity = () => {
    addToast({
      type: "success",
      title: "Nueva oportunidad creada",
      description: "Oportunidad agregada al pipeline",
    })
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // TODO: Implement search logic
  }

  const handleFilterChannel = (channel: string) => {
    setChannelFilter(channel)
    // TODO: Implement channel filter logic
  }

  const handleFilterVendedor = (vendedor: string) => {
    setVendedorFilter(vendedor)
    // TODO: Implement vendedor filter logic
  }

  return (
    <SidebarLayout>
      <PipelineCompactHeader
        onNewOpportunity={handleNewOpportunity}
        onSearch={handleSearch}
        onFilterChannel={handleFilterChannel}
        onFilterVendedor={handleFilterVendedor}
      />

      {/* Pipeline Content */}
      <div className="h-full overflow-y-auto">
        <div className="p-6">
          <KanbanBoard />
        </div>
      </div>
    </SidebarLayout>
  )
}
