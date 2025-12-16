"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NotificationsBell } from "@/components/notifications-bell"
import { Search, Download, Plus } from "lucide-react"

interface ContactsCompactHeaderProps {
  onSearch?: (query: string) => void
  onStatusFilter?: (status: string) => void
  onExportCSV?: () => void
  onNewContact?: () => void
}

export function ContactsCompactHeader({
  onSearch,
  onStatusFilter,
  onExportCSV,
  onNewContact,
}: ContactsCompactHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    onStatusFilter?.(value)
  }

  return (
    <div className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="h-[75px] px-4 md:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Title */}
        <div className="flex-shrink-0">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Contactos</h1>
        </div>

        {/* Center: Search (flexible) */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contactos..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Right: Status Filter + Export CSV + CTA + Bell */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Estado filter */}
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px] h-9 hidden sm:flex">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="qualified">Calificado</SelectItem>
              <SelectItem value="customer">Cliente</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>

          {/* Export CSV button */}
          <Button variant="outline" size="sm" onClick={onExportCSV} className="hidden md:flex gap-2 h-9 bg-transparent">
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>

          {/* CTA: Nuevo contacto */}
          <Button size="sm" onClick={onNewContact} className="h-9">
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Nuevo contacto</span>
          </Button>

          {/* Notifications Bell */}
          <NotificationsBell />
        </div>
      </div>
    </div>
  )
}
