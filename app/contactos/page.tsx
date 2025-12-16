"use client"

import { ContactsStats } from "@/components/contacts-stats"
import { ContactsList } from "@/components/contacts-list"
import { SidebarLayout } from "@/components/sidebar-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NotificationsBell } from "@/components/notifications-bell"
import { Plus, Search, Filter, Download } from "lucide-react"
import { useState } from "react"

export default function ContactosPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const handleNewContact = () => {
    // Handle new contact
  }

  return (
    <SidebarLayout>
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-start justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contactos</h1>
            <p className="text-sm text-muted-foreground mt-1">Administra tus leads y clientes</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleNewContact} className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo contacto
            </Button>
            <NotificationsBell />
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 pb-4 bg-card">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contactos..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>

          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-6 p-6">
        <ContactsStats />
        <ContactsList />
      </div>
    </SidebarLayout>
  )
}
