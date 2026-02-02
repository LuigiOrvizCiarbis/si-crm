"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Filter, Plus, MoreVertical, Phone, Mail, MessageSquare, Star, Users, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Contact {
  id: number
  name: string
  email: string | null
  phone: string
  source: string
  created_at: string
  updated_at: string
  conversations?: Array<{
    id: number
    last_message_at: string
    last_message_content: string
  }>
}

const sourceColors: Record<string, string> = {
  whatsapp: "bg-green-500/10 text-green-600 border-green-200",
  instagram: "bg-pink-500/10 text-pink-600 border-pink-200",
  facebook: "bg-blue-500/10 text-blue-600 border-blue-200",
  manual: "bg-gray-500/10 text-gray-600 border-gray-200",
}

const sourceLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  manual: "Manual",
}

export function ContactsList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchContacts()
  }, [searchTerm])

  const fetchContacts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const queryParams = new URLSearchParams()
      if (searchTerm) {
        queryParams.append("search", searchTerm)
      }
      
      const response = await fetch(`/api/contacts?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error("Error al cargar contactos")
      }
      
      const result = await response.json()
      setContacts(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const filteredContacts = contacts.filter((contact) => {
    const matchesSource = sourceFilter === "all" || contact.source === sourceFilter
    return matchesSource
  })

  const getLastContact = (contact: Contact) => {
    if (contact.conversations && contact.conversations.length > 0) {
      return format(new Date(contact.conversations[0].last_message_at), "dd/MM/yyyy", { locale: es })
    }
    return format(new Date(contact.created_at), "dd/MM/yyyy", { locale: es })
  }

  return (
    <div className="space-y-6">
      {/* Header con búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar contactos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Fuente: {sourceFilter === "all" ? "Todas" : sourceLabels[sourceFilter] || sourceFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSourceFilter("all")}>Todas</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSourceFilter("whatsapp")}>WhatsApp</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSourceFilter("instagram")}>Instagram</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSourceFilter("facebook")}>Facebook</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSourceFilter("manual")}>Manual</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Contacto
          </Button>
        </div>
      </div>

      {/* Lista de contactos */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchContacts} variant="outline">
            Reintentar
          </Button>
        </div>
      ) : (
        <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contacto</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Fuente</TableHead>
              <TableHead>Último contacto</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.map((contact) => (
              <TableRow key={contact.id} className="h-10">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {contact.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{contact.name}</p>
                      {contact.conversations && contact.conversations.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {contact.conversations[0].last_message_content}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{contact.phone}</TableCell>
                <TableCell className="text-sm">{contact.email || "-"}</TableCell>
                <TableCell>
                  <Badge className={sourceColors[contact.source] || "bg-gray-500/10 text-gray-600"} variant="outline">
                    {sourceLabels[contact.source] || contact.source}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{getLastContact(contact)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Phone className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Mail className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MessageSquare className="w-3 h-3" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Crear tarea</DropdownMenuItem>
                        <DropdownMenuItem>Agregar a pipeline</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredContacts.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No se encontraron contactos</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Intenta con otros términos de búsqueda" : "Comienza agregando tu primer contacto"}
          </p>
        </div>
      )}
      </>
      )}
    </div>
  )
}
