"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Filter, X } from "lucide-react"

export function TaskFilters() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Select>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_progreso">En Progreso</SelectItem>
            <SelectItem value="completada">Completada</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="llamada">Llamada</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="reunion">Reunión</SelectItem>
            <SelectItem value="seguimiento">Seguimiento</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="gap-2 bg-transparent">
          <Calendar className="w-4 h-4" />
          Fecha
        </Button>

        <Button variant="outline" className="gap-2 bg-transparent">
          <Filter className="w-4 h-4" />
          Más filtros
        </Button>
      </div>

      {/* Active Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Filtros activos:</span>
        <Badge variant="secondary" className="gap-1">
          Vencidas hoy
          <X className="w-3 h-3 cursor-pointer" />
        </Badge>
        <Badge variant="secondary" className="gap-1">
          Prioridad: Alta
          <X className="w-3 h-3 cursor-pointer" />
        </Badge>
      </div>
    </div>
  )
}
