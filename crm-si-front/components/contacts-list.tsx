"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Search, Filter, Plus, Upload, MoreVertical, Phone, Mail, MessageSquare, Users, Loader2, Calendar, Hash } from "lucide-react"
import { ImportContactsDialog } from "./import-contacts-dialog"
import { getAuthToken } from "@/lib/api/auth-token"
import { getPipelineStages } from "@/lib/api/pipeline"
import { createOpportunity, getOpportunities, updateOpportunityStage } from "@/lib/api/opportunities"
import { useToast } from "@/components/Toast"
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

const DEFAULT_FORM = { name: "", phone: "", email: "", source: "manual" }

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2)
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
  const { addToast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Crear/Editar contacto dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", source: "manual" })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  // Ver perfil
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileContact, setProfileContact] = useState<Contact | null>(null)

  // Eliminar
  const [deleteContact, setDeleteContact] = useState<Contact | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [addingToPipelineId, setAddingToPipelineId] = useState<number | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const profileResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchContacts(), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchTerm])

  useEffect(() => {
    return () => {
      if (profileResetRef.current) clearTimeout(profileResetRef.current)
    }
  }, [])

  const fetchContacts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const queryParams = new URLSearchParams()
      if (searchTerm) {
        queryParams.append("search", searchTerm)
      }
      
      const token = getAuthToken();
      const response = await fetch(`/api/contacts?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
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

  const handleSaveContact = async () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = "El nombre es obligatorio"
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email inválido"
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setSaving(true)
    setFormErrors({})

    const isEdit = !!editingContact
    const url = isEdit ? `/api/contacts/${editingContact.id}` : "/api/contacts"
    const method = isEdit ? "PUT" : "POST"

    try {
      const token = getAuthToken()
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          source: formData.source,
        }),
      })

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        if (result.errors) {
          setFormErrors(
            Object.fromEntries(
              Object.entries(result.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)])
            )
          )
        } else {
          setFormErrors({ _general: result.message || (isEdit ? "Error al actualizar contacto" : "Error al crear contacto") })
        }
        return
      }

      setDialogOpen(false)
      setEditingContact(null)
      setFormData({ ...DEFAULT_FORM })
      fetchContacts()
    } catch {
      setFormErrors({ _general: "Error de conexión" })
    } finally {
      setSaving(false)
    }
  }

  const openEditDialog = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      name: contact.name,
      phone: contact.phone || "",
      email: contact.email || "",
      source: contact.source || "manual",
    })
    setFormErrors({})
    setDialogOpen(true)
  }

  const openProfileSheet = (contact: Contact) => {
    if (profileResetRef.current) clearTimeout(profileResetRef.current)
    setProfileContact(contact)
    requestAnimationFrame(() => setProfileOpen(true))
  }

  const handleProfileOpenChange = (open: boolean) => {
    setProfileOpen(open)

    if (!open) {
      if (profileResetRef.current) clearTimeout(profileResetRef.current)
      profileResetRef.current = setTimeout(() => setProfileContact(null), 300)
    }
  }

  const handleDeleteContact = async () => {
    if (!deleteContact) return

    setDeleting(true)
    try {
      const token = getAuthToken()
      const response = await fetch(`/api/contacts/${deleteContact.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setDeleteContact(null)
        fetchContacts()
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(false)
    }
  }

  const handleAddToPipeline = async (contact: Contact) => {
    const latestConversation = contact.conversations?.[0]

    setAddingToPipelineId(contact.id)

    try {
      const stages = await getPipelineStages()
      const sortedStages = [...stages].sort((a, b) => a.sort_order - b.sort_order)
      const targetStage = sortedStages.find((stage) => stage.is_default) ?? sortedStages[0]

      if (!targetStage) {
        throw new Error("No hay etapas configuradas en el pipeline")
      }

      const existingOpenOpportunities = await getOpportunities({
        contactId: contact.id,
        status: "open",
      })

      const existingOpportunity = existingOpenOpportunities[0]

      if (existingOpportunity) {
        await updateOpportunityStage(existingOpportunity.id, targetStage.id)
      } else {
        await createOpportunity({
          contact_id: contact.id,
          conversation_id: latestConversation?.id ?? null,
          pipeline_stage_id: targetStage.id,
          source_type: latestConversation ? "conversation" : "manual",
          title: `Oportunidad - ${contact.name}`,
        })
      }

      addToast({
        type: "success",
        title: "Contacto agregado al pipeline",
        description: existingOpportunity
          ? `${contact.name} fue movido a ${targetStage.name}.`
          : `${contact.name} fue agregado a ${targetStage.name}.`,
      })
    } catch (error) {
      addToast({
        type: "error",
        title: "No se pudo agregar al pipeline",
        description: error instanceof Error ? error.message : "Error desconocido",
      })
    } finally {
      setAddingToPipelineId(null)
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

          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importar CSV
          </Button>

          <Button size="sm" onClick={() => setDialogOpen(true)}>
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
                        {getInitials(contact.name)}
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
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openProfileSheet(contact)}>Ver perfil</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(contact)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Crear tarea</DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={addingToPipelineId === contact.id}
                          onSelect={() => handleAddToPipeline(contact)}
                        >
                          {addingToPipelineId === contact.id ? "Agregando..." : "Agregar a pipeline"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => setDeleteContact(contact)}>Eliminar</DropdownMenuItem>
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

      {/* Dialog Crear/Editar Contacto */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) {
          setEditingContact(null)
          setFormData({ ...DEFAULT_FORM })
          setFormErrors({})
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContact ? "Editar Contacto" : "Nuevo Contacto"}</DialogTitle>
            <DialogDescription>
              {editingContact ? "Modifica los datos del contacto" : "Agrega un nuevo contacto a tu base de datos"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {formErrors._general && (
              <p className="text-sm text-destructive">{formErrors._general}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                placeholder="Nombre completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                placeholder="+54 9 11 1234-5678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              {formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contacto@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Fuente</Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveContact} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingContact ? "Guardar Cambios" : "Crear Contacto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sheet Ver Perfil */}
      <Sheet open={profileOpen} onOpenChange={handleProfileOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Perfil del Contacto</SheetTitle>
          </SheetHeader>
          {profileContact && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-lg">
                    {getInitials(profileContact.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{profileContact.name}</h3>
                  <Badge className={sourceColors[profileContact.source] || "bg-gray-500/10 text-gray-600"} variant="outline">
                    {sourceLabels[profileContact.source] || profileContact.source}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <p className="text-sm">{profileContact.phone || "No registrado"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm">{profileContact.email || "No registrado"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">ID</p>
                    <p className="text-sm">{profileContact.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Creado</p>
                    <p className="text-sm">{format(new Date(profileContact.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Última actualización</p>
                    <p className="text-sm">{format(new Date(profileContact.updated_at), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                  </div>
                </div>
              </div>

              {profileContact.conversations && profileContact.conversations.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-3">Última conversación</h4>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        {format(new Date(profileContact.conversations[0].last_message_at), "dd/MM/yyyy HH:mm", { locale: es })}
                      </p>
                      <p className="text-sm">{profileContact.conversations[0].last_message_content}</p>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                  setProfileOpen(false)
                  setTimeout(() => openEditDialog(profileContact), 300)
                }}>
                  Editar
                </Button>
                <Button variant="destructive" size="sm" className="flex-1" onClick={() => {
                  setProfileOpen(false)
                  setTimeout(() => setDeleteContact(profileContact), 300)
                }}>
                  Eliminar
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialog Importar CSV */}
      <ImportContactsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImportComplete={() => fetchContacts()}
      />

      {/* AlertDialog Eliminar */}
      <AlertDialog open={!!deleteContact} onOpenChange={(open) => { if (!open) setDeleteContact(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar contacto</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que querés eliminar a <span className="font-medium text-foreground">{deleteContact?.name}</span>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
