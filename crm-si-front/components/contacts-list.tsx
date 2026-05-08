"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Search, Filter, Plus, Upload, MoreVertical, Phone, Mail, MessageSquare, Users, Loader2, Calendar, Hash, X, GripVertical } from "lucide-react"
import { ImportContactsDialog } from "./import-contacts-dialog"
import { getAuthToken } from "@/lib/api/auth-token"
import { getPipelineStages } from "@/lib/api/pipeline"
import { createOpportunity, getOpportunities, updateOpportunityStage } from "@/lib/api/opportunities"
import { updateContact, type ContactUpdate } from "@/lib/api/contacts"
import { useAutosave } from "@/lib/hooks/useAutosave"
import { cn } from "@/lib/utils"
import { EditableCell } from "@/components/editable-cell"
import { useToast } from "@/components/Toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTranslation } from "@/hooks/useTranslation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

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
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

const AVATAR_GRADIENTS = [
  "from-cyan-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-green-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-600",
]

function getAvatarGradient(id: number): string {
  return AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length]
}

const sourceColors: Record<string, string> = {
  whatsapp: "bg-green-500/10 text-green-600 border-green-200 dark:border-green-800",
  instagram: "bg-pink-500/10 text-pink-600 border-pink-200 dark:border-pink-800",
  facebook: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800",
  manual: "bg-gray-500/10 text-gray-600 border-gray-200 dark:border-gray-700",
}

const sourceLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  manual: "Manual",
}

type ColumnId = "select" | "contact" | "phone" | "email" | "source" | "lastContact" | "actions"

interface Column {
  id: ColumnId
  labelKey: string
  width: string
  minWidth: string
  draggable: boolean
}

const DEFAULT_COLUMNS: Column[] = [
  { id: "select", labelKey: "", width: "50px", minWidth: "50px", draggable: false },
  { id: "contact", labelKey: "contactsPage.table.contact", width: "260px", minWidth: "220px", draggable: true },
  { id: "phone", labelKey: "contactsPage.table.phone", width: "180px", minWidth: "160px", draggable: true },
  { id: "email", labelKey: "contactsPage.table.email", width: "220px", minWidth: "180px", draggable: true },
  { id: "source", labelKey: "contactsPage.table.source", width: "140px", minWidth: "120px", draggable: true },
  { id: "lastContact", labelKey: "contactsPage.table.lastContact", width: "150px", minWidth: "130px", draggable: true },
  { id: "actions", labelKey: "contactsPage.table.actions", width: "150px", minWidth: "130px", draggable: true },
]

const COLUMN_ORDER_KEY = "contacts-column-order"

function loadColumnOrder(): Column[] {
  if (typeof window === "undefined") return DEFAULT_COLUMNS
  try {
    const saved = window.localStorage.getItem(COLUMN_ORDER_KEY)
    if (!saved) return DEFAULT_COLUMNS
    const ids = JSON.parse(saved) as ColumnId[]
    const ordered = ids
      .map((id) => DEFAULT_COLUMNS.find((c) => c.id === id))
      .filter((c): c is Column => Boolean(c))
    const missing = DEFAULT_COLUMNS.filter((c) => !ordered.find((o) => o.id === c.id))
    return [...ordered, ...missing]
  } catch {
    return DEFAULT_COLUMNS
  }
}

function SortableHeader({ column, label }: { column: Column; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    disabled: !column.draggable,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    width: column.width,
    minWidth: column.minWidth,
  }

  if (!column.draggable) {
    return (
      <TableHead ref={setNodeRef} style={style} className={column.id === "actions" ? "text-right" : ""}>
        {label}
      </TableHead>
    )
  }

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        "select-none cursor-grab active:cursor-grabbing",
        column.id === "actions" ? "text-right" : "",
      )}
      {...attributes}
      {...listeners}
    >
      <div className={cn("flex items-center gap-2", column.id === "actions" ? "justify-end" : "")}>
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/60" />
        <span>{label}</span>
      </div>
    </TableHead>
  )
}

interface ContactsListProps {
  hideToolbar?: boolean
}

export function ContactsList({ hideToolbar = false }: ContactsListProps = {}) {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", source: "manual" })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  const [profileOpen, setProfileOpen] = useState(false)
  const [profileContact, setProfileContact] = useState<Contact | null>(null)

  const [deleteContact, setDeleteContact] = useState<Contact | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [addingToPipelineId, setAddingToPipelineId] = useState<number | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const profileResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  type EditableField = "name" | "phone" | "email" | "source"
  const [editingCell, setEditingCell] = useState<{ contactId: number; field: EditableField } | null>(null)

  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS)

  useEffect(() => {
    setColumns(loadColumnOrder())
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(columns.map((c) => c.id)))
  }, [columns])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleColumnDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setColumns((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return items
      if (!items[oldIndex].draggable || !items[newIndex].draggable) return items
      return arrayMove(items, oldIndex, newIndex)
    })
  }

  const { save: saveAutosave } = useAutosave<{ id: number; updates: ContactUpdate }>({
    onSave: async ({ id, updates }) => {
      await updateContact(id, updates)
    },
  })

  const handleCellSave = (contact: Contact, field: EditableField, rawValue: string): void => {
    const trimmed = rawValue.trim()
    let nextValue: string | null = trimmed

    if (field === "name") {
      if (!trimmed) {
        addToast({ type: "error", title: "El nombre no puede estar vacío" })
        return
      }
    } else if (field === "email") {
      if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        addToast({ type: "error", title: "Email inválido" })
        return
      }
      nextValue = trimmed || null
    } else if (field === "phone") {
      nextValue = trimmed || null
    }

    setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, [field]: nextValue } : c)))
    setEditingCell(null)
    saveAutosave({ id: contact.id, updates: { [field]: nextValue } as ContactUpdate })
  }

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

  // Listen to compact header events
  useEffect(() => {
    const handleNewContact = () => setDialogOpen(true)
    const handleExportCsv = () => exportCSV()
    window.addEventListener("contacts-new-contact", handleNewContact)
    window.addEventListener("contacts-export-csv", handleExportCsv)
    return () => {
      window.removeEventListener("contacts-new-contact", handleNewContact)
      window.removeEventListener("contacts-export-csv", handleExportCsv)
    }
  }, [contacts])

  const fetchContacts = async () => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (searchTerm) queryParams.append("search", searchTerm)
      const token = getAuthToken()
      const response = await fetch(`/api/contacts?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Error al cargar contactos")
      const result = await response.json()
      setContacts(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    const headers = ["Nombre", "Teléfono", "Email", "Fuente", "Último contacto"]
    const rows = contacts.map((c) => [
      c.name,
      c.phone || "",
      c.email || "",
      sourceLabels[c.source] || c.source,
      getLastContact(c),
    ])
    const csvContent = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `contactos_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
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
      if (!targetStage) throw new Error("No hay etapas configuradas en el pipeline")

      const existingOpenOpportunities = await getOpportunities({ contactId: contact.id, status: "open" })
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

  const getLastContact = (contact: Contact): string => {
    if (contact.conversations && contact.conversations.length > 0) {
      return format(new Date(contact.conversations[0].last_message_at), "dd/MM/yyyy", { locale: es })
    }
    return format(new Date(contact.created_at), "dd/MM/yyyy", { locale: es })
  }

  const renderCell = (contact: Contact, columnId: ColumnId): React.ReactNode => {
    switch (columnId) {
      case "select":
        return (
          <Checkbox
            checked={selectedIds.has(contact.id)}
            onCheckedChange={() => toggleSelect(contact.id)}
          />
        )
      case "contact":
        return (
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 flex-shrink-0">
              <AvatarFallback
                className={`text-xs font-bold bg-gradient-to-br ${getAvatarGradient(contact.id)} text-white`}
              >
                {getInitials(contact.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <EditableCell
                type="text"
                value={contact.name}
                isEditing={editingCell?.contactId === contact.id && editingCell?.field === "name"}
                onEditStart={() => setEditingCell({ contactId: contact.id, field: "name" })}
                onCancel={() => setEditingCell(null)}
                onSave={(val) => handleCellSave(contact, "name", val)}
                renderDisplay={(val) => <p className="font-semibold text-sm truncate">{val}</p>}
                className="px-1"
              />
              {contact.conversations && contact.conversations.length > 0 ? (
                <p className="text-xs text-muted-foreground truncate max-w-[180px] px-1">
                  {contact.conversations[0].last_message_content}
                </p>
              ) : null}
            </div>
          </div>
        )
      case "phone":
        return (
          <EditableCell
            type="text"
            value={contact.phone || ""}
            placeholder="+54 9 11 1234-5678"
            isEditing={editingCell?.contactId === contact.id && editingCell?.field === "phone"}
            onEditStart={() => setEditingCell({ contactId: contact.id, field: "phone" })}
            onCancel={() => setEditingCell(null)}
            onSave={(val) => handleCellSave(contact, "phone", val)}
            renderDisplay={(val) =>
              val ? (
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <MessageSquare className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-mono tabular-nums">{val}</span>
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">—</span>
              )
            }
          />
        )
      case "email":
        return (
          <EditableCell
            type="text"
            value={contact.email || ""}
            placeholder="email@dominio.com"
            isEditing={editingCell?.contactId === contact.id && editingCell?.field === "email"}
            onEditStart={() => setEditingCell({ contactId: contact.id, field: "email" })}
            onCancel={() => setEditingCell(null)}
            onSave={(val) => handleCellSave(contact, "email", val)}
            renderDisplay={(val) =>
              val ? <span className="text-sm text-muted-foreground">{val}</span> : <span className="text-muted-foreground">—</span>
            }
          />
        )
      case "source":
        return (
          <EditableCell
            type="select"
            value={contact.source}
            options={[
              { value: "manual", label: "Manual" },
              { value: "whatsapp", label: "WhatsApp" },
              { value: "instagram", label: "Instagram" },
              { value: "facebook", label: "Facebook" },
            ]}
            isEditing={editingCell?.contactId === contact.id && editingCell?.field === "source"}
            onEditStart={() => setEditingCell({ contactId: contact.id, field: "source" })}
            onCancel={() => setEditingCell(null)}
            onSave={(val) => handleCellSave(contact, "source", val)}
            renderDisplay={(val) => (
              <Badge
                className={sourceColors[val] || "bg-gray-500/10 text-gray-600 border-gray-200"}
                variant="outline"
              >
                {sourceLabels[val] || val}
              </Badge>
            )}
          />
        )
      case "lastContact":
        return <span className="text-sm text-muted-foreground tabular-nums">{getLastContact(contact)}</span>
      case "actions":
        return (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
              <Phone className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
              <Mail className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
              <MessageSquare className="w-3.5 h-3.5" />
            </Button>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                  <MoreVertical className="w-3.5 h-3.5" />
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
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteContact(contact)}
                >
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      default:
        return null
    }
  }

  const allSelected = filteredContacts.length > 0 && filteredContacts.every((c) => selectedIds.has(c.id))

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredContacts.map((c) => c.id)))
    }
  }

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  return (
    <div className="space-y-4">
      {!hideToolbar && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t("contactsPage.searchPlaceholder")}
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
                  {t("contactsPage.filters.status")}: {sourceFilter === "all" ? t("contactsPage.filters.all") : sourceLabels[sourceFilter] || sourceFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSourceFilter("all")}>{t("contactsPage.filters.all")}</DropdownMenuItem>
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
              {t("contactsPage.actions.newContact")}
            </Button>
          </div>
        </div>
      )}

      {/* Bulk selection bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-primary/10 border border-primary/20 rounded-lg">
          <Badge variant="secondary" className="text-sm font-semibold">
            {selectedIds.size} contacto{selectedIds.size !== 1 ? "s" : ""} seleccionado{selectedIds.size !== 1 ? "s" : ""}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
            <X className="w-3 h-3 mr-1" />
            Cancelar
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchContacts} variant="outline">Reintentar</Button>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
                <Table className="min-w-[1100px]">
                  <TableHeader className="sticky top-0 z-10 bg-background border-b">
                    <TableRow>
                      <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
                        {columns.map((column) => {
                          if (column.id === "select") {
                            return (
                              <TableHead key={column.id} style={{ width: column.width, minWidth: column.minWidth }} className="px-4">
                                <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
                              </TableHead>
                            )
                          }
                          return (
                            <SortableHeader
                              key={column.id}
                              column={column}
                              label={column.labelKey ? t(column.labelKey) : ""}
                            />
                          )
                        })}
                      </SortableContext>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact, idx) => (
                      <TableRow
                        key={contact.id}
                        className={`${idx % 2 === 0 ? "bg-muted/30" : ""} hover:bg-muted/50 transition-colors`}
                      >
                        {columns.map((column) => (
                          <TableCell
                            key={column.id}
                            className={`py-3 ${column.id === "select" ? "px-4" : ""} ${column.id === "actions" ? "text-right" : ""}`}
                            style={{ width: column.width, minWidth: column.minWidth, maxWidth: column.width }}
                          >
                            {renderCell(contact, column.id)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DndContext>
            </div>
          </div>

          {filteredContacts.length === 0 && (
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

      {/* Dialog Crear/Editar */}
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
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
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
                  <AvatarFallback
                    className={`text-xl font-bold bg-gradient-to-br ${getAvatarGradient(profileContact.id)} text-white`}
                  >
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
                }}>Editar</Button>
                <Button variant="destructive" size="sm" className="flex-1" onClick={() => {
                  setProfileOpen(false)
                  setTimeout(() => setDeleteContact(profileContact), 300)
                }}>Eliminar</Button>
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
              ¿Estás seguro de que querés eliminar a{" "}
              <span className="font-medium text-foreground">{deleteContact?.name}</span>? Esta acción no se puede deshacer.
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
