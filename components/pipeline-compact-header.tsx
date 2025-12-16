"use client"

import type React from "react"

import { useState } from "react"
import { Search, Plus, Filter, Users, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NotificationsBell } from "@/components/notifications-bell"

interface PipelineCompactHeaderProps {
  onNewOpportunity?: () => void
  onSearch?: (query: string) => void
  onFilterChannel?: (channel: string) => void
  onFilterVendedor?: (vendedor: string) => void
}

export function PipelineCompactHeader({
  onNewOpportunity,
  onSearch,
  onFilterChannel,
  onFilterVendedor,
}: PipelineCompactHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedChannel, setSelectedChannel] = useState("all")
  const [selectedVendedor, setSelectedVendedor] = useState("all")

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    onSearch?.(value)
  }

  const handleChannelChange = (value: string) => {
    setSelectedChannel(value)
    onFilterChannel?.(value)
  }

  const handleVendedorChange = (value: string) => {
    setSelectedVendedor(value)
    onFilterVendedor?.(value)
  }

  return (
    <header className="sticky top-0 z-40 h-[75px] flex items-center gap-4 px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      {/* Titulo */}
      <div className="flex items-center gap-2 min-w-fit">
        <h1 className="text-xl font-semibold tracking-tight">Pipeline de Oportunidades</h1>
      </div>

      {/* Buscador flexible */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar leads..." value={searchQuery} onChange={handleSearchChange} className="pl-9 h-9" />
        </div>
      </div>

      {/* Filtros compactos */}
      <div className="flex items-center gap-2">
        {/* Canales */}
        <Select value={selectedChannel} onValueChange={handleChannelChange}>
          <SelectTrigger className="h-9 w-[140px]">
            <MessageSquare className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Canales" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los canales</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="web">Web</SelectItem>
          </SelectContent>
        </Select>

        {/* Vendedor */}
        <Select value={selectedVendedor} onValueChange={handleVendedorChange}>
          <SelectTrigger className="h-9 w-[140px]">
            <Users className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Vendedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="lucas">Lucas Coria</SelectItem>
            <SelectItem value="luigi">Luigi Orviz</SelectItem>
            <SelectItem value="maria">María García</SelectItem>
            <SelectItem value="juan">Juan Pérez</SelectItem>
          </SelectContent>
        </Select>

        {/* Más filtros (Sheet) */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 bg-transparent">
              <Filter className="h-4 w-4 mr-2" />
              Más filtros
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtros avanzados</SheetTitle>
              <SheetDescription>Configura filtros adicionales para el pipeline</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Estado</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="new">Nuevos</SelectItem>
                    <SelectItem value="contacted">Contactados</SelectItem>
                    <SelectItem value="qualified">Calificados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Valor estimado</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Rango de valor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="low">Menos de $10k</SelectItem>
                    <SelectItem value="medium">$10k - $50k</SelectItem>
                    <SelectItem value="high">Más de $50k</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Fecha</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoy</SelectItem>
                    <SelectItem value="week">Esta semana</SelectItem>
                    <SelectItem value="month">Este mes</SelectItem>
                    <SelectItem value="all">Todo el tiempo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* CTA + Campanita */}
      <div className="flex items-center gap-2 ml-auto">
        <Button onClick={onNewOpportunity} size="sm" className="h-9">
          <Plus className="h-4 w-4 mr-2" />
          Nueva oportunidad
        </Button>
        <NotificationsBell />
      </div>
    </header>
  )
}
