"use client"

import { Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NotificationsBell } from "@/components/notifications-bell"

interface AdministracionCompactHeaderProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  onNewPayment: () => void
}

export function AdministracionCompactHeader({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onNewPayment,
}: AdministracionCompactHeaderProps) {
  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="h-[75px] px-6 flex items-center gap-4">
        {/* Título */}
        <h1 className="text-lg font-semibold shrink-0">Administración</h1>

        {/* Búsqueda */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9"
          />
        </div>

        {/* Filtro de estado */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-48 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="paid">Pagados</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="overdue">Vencidos</SelectItem>
          </SelectContent>
        </Select>

        {/* CTA + Campanita */}
        <div className="flex items-center gap-2">
          <Button onClick={onNewPayment} className="h-9">
            <Plus className="w-4 h-4 mr-2" />
            Registrar Pago
          </Button>
          <NotificationsBell />
        </div>
      </div>
    </div>
  )
}
