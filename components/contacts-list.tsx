"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { EditableCell } from "@/components/editable-cell"
import { useAutosave } from "@/lib/hooks/useAutosave"
import { updateContact, bulkUpdateContacts } from "@/lib/api/contacts"
import { MoreVertical, Phone, Mail, MessageSquare, Star, Users, GripVertical, Edit } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Toaster, toast } from "sonner"
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
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useAppStore } from "@/store/useAppStore"

export interface Contact {
  id: string
  name: string
  email: string
  phone: string
  company: string
  position: string
  source: string
  status: "lead" | "qualified" | "customer" | "inactive"
  score: number
  lastContact: string
  tags: string[]
  avatar?: string
  vendedor: string
  etapaPipeline: string
  queBusca: string
  tipoPropiedad: string
  zonaBarrio: string
  notas: string
  pipelineId?: string
}

const mockContacts: Contact[] = [
  {
    id: "1",
    name: "María González",
    email: "maria@empresa.com",
    phone: "+54 9 223 555-1234",
    company: "Tech Solutions SA",
    position: "Directora de Marketing",
    source: "WhatsApp",
    status: "qualified",
    score: 85,
    lastContact: "2024-01-15",
    tags: ["VIP", "Enterprise"],
    avatar: "/professional-woman-diverse.png",
    vendedor: "Martín",
    etapaPipeline: "En seguimiento",
    queBusca: "Alquiler",
    tipoPropiedad: "Depto 3 amb.",
    zonaBarrio: "Chauvín, Aldrey, Güemes",
    notas: "Familia de 4 personas, luminoso, c/cochera y balcón a la calle. Puede pagar 750 USD/mes.",
    pipelineId: "1",
  },
  {
    id: "2",
    name: "Carlos Rodríguez",
    email: "carlos@startup.io",
    phone: "+54 9 11 9876-5432",
    company: "StartupIO",
    position: "CEO",
    source: "Instagram",
    status: "lead",
    score: 72,
    lastContact: "2024-01-14",
    tags: ["Startup", "Tech"],
    avatar: "/professional-man.png",
    vendedor: "Valeria",
    etapaPipeline: "Contactado",
    queBusca: "Venta",
    tipoPropiedad: "Oficina comercial",
    zonaBarrio: "Microcentro",
    notas: "Busca espacio para equipo de 15 personas. Presupuesto flexible.",
    pipelineId: "2",
  },
  {
    id: "3",
    name: "Ana Martínez",
    email: "ana@retail.com",
    phone: "+54 9 223 5555-1234",
    company: "Retail Plus",
    position: "Gerente de Ventas",
    source: "WhatsApp",
    status: "customer",
    score: 95,
    lastContact: "2024-01-13",
    tags: ["Retail", "Recurrente"],
    avatar: "/confident-business-woman.png",
    vendedor: "Valeria",
    etapaPipeline: "Cliente Convertido",
    queBusca: "Venta",
    tipoPropiedad: "PH",
    zonaBarrio: "Parque Luro",
    notas: "Tiene apuro, está en sucesión.",
    pipelineId: "3",
  },
  {
    id: "4",
    name: "Diego López",
    email: "diego@consulting.com",
    phone: "+54 9 11 7777-8888",
    company: "López Consulting",
    position: "Consultor Senior",
    source: "LinkedIn",
    status: "qualified",
    score: 78,
    lastContact: "2024-01-12",
    tags: ["Consulting", "B2B"],
    avatar: "/consultant-man.jpg",
    vendedor: "Sergio",
    etapaPipeline: "Envié propuesta",
    queBusca: "Compra cdo.",
    tipoPropiedad: "Audi A3",
    zonaBarrio: "Mar del Plata",
    notas: "Tiene un A2 para entregar y 25k USD.",
    pipelineId: "4",
  },
  {
    id: "5",
    name: "Lucía Fernández",
    email: "lucia@ecommerce.com",
    phone: "+54 9 11 3333-4444",
    company: "E-commerce Pro",
    position: "CMO",
    source: "Facebook",
    status: "lead",
    score: 65,
    lastContact: "2024-01-11",
    tags: ["E-commerce", "Digital"],
    avatar: "/marketing-woman.png",
    vendedor: "Daniel",
    etapaPipeline: "Lead/Prospecto",
    queBusca: "Plan de Ahorro",
    tipoPropiedad: "VW Polo Highline",
    zonaBarrio: "Mar del Plata",
    notas: "Soltero, 30 años.",
    pipelineId: "5",
  },
  {
    id: "6",
    name: "Roberto Silva",
    email: "roberto@inversiones.com",
    phone: "+54 9 223 4444-5555",
    company: "Silva Inversiones",
    position: "Director",
    source: "WhatsApp",
    status: "qualified",
    score: 88,
    lastContact: "2024-01-10",
    tags: ["Inversor"],
    avatar: "/placeholder.svg",
    vendedor: "Martín",
    etapaPipeline: "Interesado",
    queBusca: "Compra",
    tipoPropiedad: "Depto 2 amb.",
    zonaBarrio: "Centro",
    notas: "Busca para inversión, sin apuro.",
    pipelineId: "6",
  },
  {
    id: "7",
    name: "Patricia Gómez",
    email: "patricia@global.com",
    phone: "+54 9 11 6666-7777",
    company: "Global Services",
    position: "Gerente General",
    source: "LinkedIn",
    status: "customer",
    score: 92,
    lastContact: "2024-01-09",
    tags: ["Corporativo"],
    avatar: "/placeholder.svg",
    vendedor: "Daniel",
    etapaPipeline: "Seguimiento para cierre",
    queBusca: "Compra cdo.",
    tipoPropiedad: "VW Amarok V6",
    zonaBarrio: "Mar del Plata",
    notas: "Trabaja en el campo.",
    pipelineId: "7",
  },
]

const statusColors = {
  lead: "bg-blue-500/10 text-blue-600 border-blue-200",
  qualified: "bg-orange-500/10 text-orange-600 border-orange-200",
  customer: "bg-green-500/10 text-green-600 border-green-200",
  inactive: "bg-gray-500/10 text-gray-600 border-gray-200",
}

const statusLabels = {
  lead: "Lead",
  qualified: "Calificado",
  customer: "Cliente",
  inactive: "Inactivo",
}

type ColumnId =
  | "select"
  | "contacto"
  | "empresa"
  | "vendedor"
  | "telefono"
  | "etapaPipeline"
  | "queBusca"
  | "tipoPropiedad"
  | "zonaBarrio"
  | "notas"
  | "estado"
  | "score"
  | "fuente"
  | "ultimoContacto"
  | "acciones"

interface Column {
  id: ColumnId
  label: string
  width?: string
  minWidth?: string
}

const DEFAULT_COLUMNS: Column[] = [
  { id: "select", label: "", width: "50px", minWidth: "50px" },
  { id: "contacto", label: "Contacto", width: "250px", minWidth: "250px" },
  { id: "empresa", label: "Empresa", width: "180px", minWidth: "150px" },
  { id: "vendedor", label: "Vendedor", width: "140px", minWidth: "120px" },
  { id: "telefono", label: "Teléfono", width: "180px", minWidth: "180px" },
  { id: "etapaPipeline", label: "Etapa Pipeline", width: "160px", minWidth: "140px" },
  { id: "queBusca", label: "Qué Busca", width: "140px", minWidth: "120px" },
  { id: "tipoPropiedad", label: "Tipo Prop./Vehículo", width: "180px", minWidth: "150px" },
  { id: "zonaBarrio", label: "Zona/Barrio", width: "160px", minWidth: "140px" },
  { id: "notas", label: "Notas", width: "280px", minWidth: "250px" },
  { id: "estado", label: "Estado", width: "130px", minWidth: "110px" },
  { id: "score", label: "Score", width: "100px", minWidth: "90px" },
  { id: "fuente", label: "Fuente", width: "130px", minWidth: "110px" },
  { id: "ultimoContacto", label: "Último contacto", width: "150px", minWidth: "130px" },
  { id: "acciones", label: "Acciones", width: "150px", minWidth: "150px" },
]

function SortableHeader({ column }: { column: Column }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: column.id === "select" ? "default" : "grab",
    minWidth: column.minWidth,
    width: column.width,
  }

  if (column.id === "select") {
    return (
      <TableHead ref={setNodeRef} style={style}>
        {column.label}
      </TableHead>
    )
  }

  return (
    <TableHead ref={setNodeRef} style={style} {...attributes} {...listeners} className="select-none">
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
        <span>{column.label}</span>
      </div>
    </TableHead>
  )
}

export function ContactsList({
  searchQuery: externalSearchQuery = "",
  statusFilter: externalStatusFilter = "all",
}: {
  searchQuery?: string
  statusFilter?: string
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [contacts, setContacts] = useState(mockContacts)
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [bulkEditOpen, setBulkEditOpen] = useState(false)
  const [undoState, setUndoState] = useState<{ contacts: Contact[]; timeout: NodeJS.Timeout } | null>(null)
  const [columns, setColumns] = useState<Column[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("contacts-column-order")
      if (saved) {
        try {
          const savedIds = JSON.parse(saved) as ColumnId[]
          return savedIds.map((id) => DEFAULT_COLUMNS.find((col) => col.id === id)!).filter(Boolean)
        } catch {
          return DEFAULT_COLUMNS
        }
      }
    }
    return DEFAULT_COLUMNS
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const getStageColor = useAppStore((state) => state.getStageColor)
  const updateLeadStage = useAppStore((state) => state.updateLeadStage)
  const stageColors = useAppStore((state) => state.stageColors)

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("contacts-column-order", JSON.stringify(columns.map((c) => c.id)))
    }
  }, [columns])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const activeSearchTerm = externalSearchQuery || searchTerm
  const activeStatusFilter = externalStatusFilter || statusFilter

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
      contact.company.toLowerCase().includes(activeSearchTerm.toLowerCase())
    const matchesStatus = activeStatusFilter === "all" || contact.status === activeStatusFilter
    return matchesSearch && matchesStatus
  })

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-orange-600"
    return "text-red-600"
  }

  const handleExportCSV = () => {
    const headers = [
      "Nombre",
      "Email",
      "Teléfono",
      "Empresa",
      "Puesto",
      "Vendedor",
      "Etapa Pipeline",
      "Qué Busca",
      "Tipo de Propiedad/Vehículo",
      "Zona/Barrio",
      "Notas",
      "Fuente",
      "Score",
    ]
    const csvContent = [
      headers.join(","),
      ...filteredContacts.map((c) =>
        [
          c.name,
          c.email,
          c.phone,
          c.company,
          c.position,
          c.vendedor,
          c.etapaPipeline,
          c.queBusca,
          c.tipoPropiedad,
          c.zonaBarrio,
          `"${c.notas}"`,
          c.source,
          c.score,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `contactos_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const [editingCell, setEditingCell] = useState<{ contactId: string; columnId: ColumnId } | null>(null)

  const { save: autosave } = useAutosave({
    onSave: async (data: { contactId: string; updates: Partial<Contact> }) => {
      await updateContact(data.contactId, data.updates)
    },
    debounceMs: 600,
    showToast: true,
  })

  const handleCellSave = async (contactId: string, columnId: ColumnId, value: string | number) => {
    const fieldMap: Record<ColumnId, keyof Contact> = {
      contacto: "name",
      empresa: "company",
      vendedor: "vendedor",
      telefono: "phone",
      etapaPipeline: "etapaPipeline",
      queBusca: "queBusca",
      tipoPropiedad: "tipoPropiedad",
      zonaBarrio: "zonaBarrio",
      notas: "notas",
      estado: "status",
      score: "score",
      fuente: "source",
      ultimoContacto: "lastContact",
      acciones: "id",
      select: "id",
    }

    const field = fieldMap[columnId]
    if (!field || field === "id") return

    const previousContacts = [...contacts]

    setContacts((prev) =>
      prev.map((contact) => {
        if (contact.id === contactId) {
          return { ...contact, [field]: value }
        }
        return contact
      }),
    )
    setEditingCell(null)

    try {
      await autosave(
        {
          contactId,
          updates: { [field]: value },
        },
        false,
      )
    } catch (error) {
      setContacts(previousContacts)
      console.error("[v0] Failed to save contact:", error)
    }
  }

  const handleCellCancel = () => {
    setEditingCell(null)
  }

  const handleNavigate = (contactId: string, columnId: ColumnId, direction: "up" | "down" | "left" | "right") => {
    const contactIndex = filteredContacts.findIndex((c) => c.id === contactId)
    const columnIndex = columns.findIndex((c) => c.id === columnId)

    if (direction === "up" && contactIndex > 0) {
      setEditingCell({ contactId: filteredContacts[contactIndex - 1].id, columnId })
    } else if (direction === "down" && contactIndex < filteredContacts.length - 1) {
      setEditingCell({ contactId: filteredContacts[contactIndex + 1].id, columnId })
    } else if (direction === "left" && columnIndex > 0) {
      setEditingCell({ contactId, columnId: columns[columnIndex - 1].id })
    } else if (direction === "right" && columnIndex < columns.length - 1) {
      setEditingCell({ contactId, columnId: columns[columnIndex + 1].id })
    }
  }

  const handleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set())
    } else {
      setSelectedContacts(new Set(filteredContacts.map((c) => c.id)))
    }
  }

  const handleSelectOne = (contactId: string) => {
    const newSelected = new Set(selectedContacts)
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId)
    } else {
      newSelected.add(contactId)
    }
    setSelectedContacts(newSelected)
  }

  const handleBulkEdit = async (field: string, value: string) => {
    const selectedIds = Array.from(selectedContacts)
    const previousContacts = [...contacts]

    if (undoState?.timeout) {
      clearTimeout(undoState.timeout)
    }

    setContacts((prev) =>
      prev.map((contact) => (selectedIds.includes(contact.id) ? { ...contact, [field]: value } : contact)),
    )

    const timeout = setTimeout(async () => {
      try {
        await bulkUpdateContacts(selectedIds, { [field]: value } as Partial<Contact>)
        toast.success(`${selectedIds.length} contactos actualizados`)
      } catch (error) {
        setContacts(previousContacts)
        toast.error("Error al actualizar. Se revirtieron los cambios.")
      } finally {
        setUndoState(null)
      }
    }, 5000)

    setUndoState({ contacts: previousContacts, timeout })

    toast.success(`Actualizando ${selectedIds.length} contactos...`, {
      duration: 5000,
      action: {
        label: "Deshacer",
        onClick: () => handleUndo(),
      },
    })

    setSelectedContacts(new Set())
    setBulkEditOpen(false)
  }

  const handleUndo = () => {
    if (undoState) {
      clearTimeout(undoState.timeout)
      setContacts(undoState.contacts)
      setUndoState(null)
      toast.info("Cambios revertidos")
    }
  }

  useEffect(() => {
    return () => {
      if (undoState?.timeout) {
        clearTimeout(undoState.timeout)
      }
    }
  }, [undoState])

  useEffect(() => {
    const handleExport = () => {
      handleExportCSV()
    }
    window.addEventListener("contacts-export-csv", handleExport)
    return () => window.removeEventListener("contacts-export-csv", handleExport)
  }, [filteredContacts])

  const renderCell = (contact: Contact, columnId: ColumnId) => {
    const isEditing = editingCell?.contactId === contact.id && editingCell?.columnId === columnId

    if (columnId === "select") {
      return <Checkbox checked={selectedContacts.has(contact.id)} onCheckedChange={() => handleSelectOne(contact.id)} />
    }

    switch (columnId) {
      case "contacto":
        return (
          <EditableCell
            value={contact.name}
            type="text"
            isEditing={isEditing}
            onEditStart={() => setEditingCell({ contactId: contact.id, columnId })}
            onSave={(value) => handleCellSave(contact.id, columnId, value)}
            onCancel={handleCellCancel}
            onNavigate={(dir) => handleNavigate(contact.id, columnId, dir)}
            validation={validateRequired}
            renderDisplay={(value) => (
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
                  <AvatarFallback className="text-xs">
                    {contact.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm md:text-base truncate">{value as string}</p>
                    {contact.score >= 80 && <Star className="w-3 h-3 text-yellow-500 fill-current flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{contact.position}</p>
                </div>
              </div>
            )}
          />
        )
      case "empresa":
        return (
          <EditableCell
            value={contact.company}
            type="text"
            isEditing={isEditing}
            onEditStart={() => setEditingCell({ contactId: contact.id, columnId })}
            onSave={(value) => handleCellSave(contact.id, columnId, value)}
            onCancel={handleCellCancel}
            onNavigate={(dir) => handleNavigate(contact.id, columnId, dir)}
          />
        )
      case "vendedor":
        return (
          <EditableCell
            value={contact.vendedor}
            type="text"
            isEditing={isEditing}
            onEditStart={() => setEditingCell({ contactId: contact.id, columnId })}
            onSave={(value) => handleCellSave(contact.id, columnId, value)}
            onCancel={handleCellCancel}
            onNavigate={(dir) => handleNavigate(contact.id, columnId, dir)}
            validation={validateRequired}
          />
        )
      case "telefono":
        return (
          <EditableCell
            value={contact.phone}
            type="phone"
            isEditing={isEditing}
            onEditStart={() => setEditingCell({ contactId: contact.id, columnId })}
            onSave={(value) => handleCellSave(contact.id, columnId, value)}
            onCancel={handleCellCancel}
            onNavigate={(dir) => handleNavigate(contact.id, columnId, dir)}
            validation={(val) => validateRequired(val) || validatePhone(val as string)}
            renderDisplay={(value) => (
              <div className="flex items-center gap-2 whitespace-nowrap">
                <MessageSquare className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm font-mono tabular-nums">{value as string}</span>
              </div>
            )}
          />
        )
      case "etapaPipeline":
        return (
          <EditableCell
            value={contact.etapaPipeline}
            type="select"
            options={ETAPAS_PIPELINE}
            isEditing={isEditing}
            onEditStart={() => setEditingCell({ contactId: contact.id, columnId })}
            onSave={(value) => {
              handleCellSave(contact.id, columnId, value)
              const stageId = stageColors.find((s) => s.name === value)?.id
              if (stageId && contact.pipelineId) {
                updateLeadStage(contact.pipelineId, stageId)
              }
            }}
            onCancel={handleCellCancel}
            onNavigate={(dir) => handleNavigate(contact.id, columnId, dir)}
            renderDisplay={(value) => {
              const stageId = stageColors.find((s) => s.name === value)?.id
              const color = stageId ? getStageColor(stageId) : "#6b7280"
              return (
                <Badge
                  variant="outline"
                  className="text-xs whitespace-nowrap"
                  style={{
                    borderColor: color,
                    color: color,
                    backgroundColor: `${color}15`,
                  }}
                >
                  {value as string}
                </Badge>
              )
            }}
          />
        )
      case "queBusca":
        return (
          <EditableCell
            value={contact.queBusca}
            type="select"
            options={QUE_BUSCA_OPTIONS}
            isEditing={isEditing}
            onEditStart={() => setEditingCell({ contactId: contact.id, columnId })}
            onSave={(value) => handleCellSave(contact.id, columnId, value)}
            onCancel={handleCellCancel}
            onNavigate={(dir) => handleNavigate(contact.id, columnId, dir)}
          />
        )
      case "tipoPropiedad":
        return (
          <EditableCell
            value={contact.tipoPropiedad}
            type="select"
            options={TIPO_PROPIEDAD_OPTIONS}
            isEditing={isEditing}
            onEditStart={() => setEditingCell({ contactId: contact.id, columnId })}
            onSave={(value) => handleCellSave(contact.id, columnId, value)}
            onCancel={handleCellCancel}
            onNavigate={(dir) => handleNavigate(contact.id, columnId, dir)}
          />
        )
      case "zonaBarrio":
        return (
          <EditableCell
            value={contact.zonaBarrio}
            type="text"
            isEditing={isEditing}
            onEditStart={() => setEditingCell({ contactId: contact.id, columnId })}
            onSave={(value) => handleCellSave(contact.id, columnId, value)}
            onCancel={handleCellCancel}
            onNavigate={(dir) => handleNavigate(contact.id, columnId, dir)}
          />
        )
      case "notas":
        return (
          <EditableCell
            value={contact.notas}
            type="textarea"
            isEditing={isEditing}
            onEditStart={() => setEditingCell({ contactId: contact.id, columnId })}
            onSave={(value) => handleCellSave(contact.id, columnId, value)}
            onCancel={handleCellCancel}
            onNavigate={(dir) => handleNavigate(contact.id, columnId, dir)}
            renderDisplay={(value) => (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-sm text-muted-foreground max-h-[112px] overflow-hidden leading-relaxed">
                      <div className="line-clamp-3">{value as string}</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm">
                    <p className="whitespace-pre-wrap">{value as string}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          />
        )
      case "estado":
        return (
          <EditableCell
            value={contact.status}
            type="select"
            options={ESTADO_OPTIONS.map((s) => s.toLowerCase())}
            isEditing={isEditing}
            onEditStart={() => setEditingCell({ contactId: contact.id, columnId })}
            onSave={(value) => handleCellSave(contact.id, columnId, value)}
            onCancel={handleCellCancel}
            onNavigate={(dir) => handleNavigate(contact.id, columnId, dir)}
            renderDisplay={(value) => (
              <Badge className={statusColors[value as keyof typeof statusColors]} variant="outline">
                {statusLabels[value as keyof typeof statusLabels]}
              </Badge>
            )}
          />
        )
      case "score":
        return (
          <EditableCell
            value={contact.score}
            type="score"
            isEditing={isEditing}
            onEditStart={() => setEditingCell({ contactId: contact.id, columnId })}
            onSave={(value) => handleCellSave(contact.id, columnId, value)}
            onCancel={handleCellCancel}
            onNavigate={(dir) => handleNavigate(contact.id, columnId, dir)}
            validation={validateScore}
            renderDisplay={(value) => (
              <span className={`font-semibold text-sm tabular-nums ${getScoreColor(value as number)}`}>
                {value}/100
              </span>
            )}
          />
        )
      case "fuente":
        return (
          <EditableCell
            value={contact.source}
            type="select"
            options={FUENTE_OPTIONS}
            isEditing={isEditing}
            onEditStart={() => setEditingCell({ contactId: contact.id, columnId })}
            onSave={(value) => handleCellSave(contact.id, columnId, value)}
            onCancel={handleCellCancel}
            onNavigate={(dir) => handleNavigate(contact.id, columnId, dir)}
          />
        )
      case "ultimoContacto":
        return (
          <EditableCell
            value={contact.lastContact}
            type="date"
            isEditing={isEditing}
            onEditStart={() => setEditingCell({ contactId: contact.id, columnId })}
            onSave={(value) => handleCellSave(contact.id, columnId, value)}
            onCancel={handleCellCancel}
            onNavigate={(dir) => handleNavigate(contact.id, columnId, dir)}
            renderDisplay={(value) => (
              <span className="text-sm text-muted-foreground tabular-nums">{value as string}</span>
            )}
          />
        )
      case "acciones":
        return (
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
        )
      default:
        return null
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        if (editingCell) {
          const contact = contacts.find((c) => c.id === editingCell.contactId)
          if (contact) {
            const field = fieldMap[editingCell.columnId]
            if (field && field !== "id") {
              autosave(
                {
                  contactId: editingCell.contactId,
                  updates: { [field]: (contact as any)[field] },
                },
                true, // Immediate save
              )
            }
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [editingCell, contacts, autosave])

  return (
    <div className="space-y-4">
      <Toaster position="top-center" />

      {/* Bulk edit indicator */}
      {selectedContacts.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm font-semibold">
              {selectedContacts.size} contacto{selectedContacts.size > 1 ? "s" : ""} seleccionado
              {selectedContacts.size > 1 ? "s" : ""}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setBulkEditOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar en lote
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedContacts(new Set())}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Table container with horizontal scroll */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Table className="min-w-[1800px]">
              <TableHeader className="sticky top-0 z-10 bg-background border-b">
                <TableRow>
                  <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
                    <TableHead style={{ width: "50px", minWidth: "50px" }}>
                      <Checkbox
                        checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    {columns
                      .filter((c) => c.id !== "select")
                      .map((column) => (
                        <SortableHeader key={column.id} column={column} />
                      ))}
                  </SortableContext>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact, idx) => (
                  <TableRow key={contact.id} className={idx % 2 === 0 ? "bg-muted/30" : ""}>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        style={{
                          minWidth: column.minWidth,
                          width: column.width,
                          maxWidth: column.width,
                        }}
                        className="border-r border-border/40 last:border-r-0"
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
            {activeSearchTerm ? "Intenta con otros términos de búsqueda" : "Comienza agregando tu primer contacto"}
          </p>
        </div>
      )}
    </div>
  )
}

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const validatePhone = (phone: string) => /^\+\d{1,3}\s?\d{10}$/.test(phone)
const validateScore = (score: number) => score >= 0 && score <= 100
const validateRequired = (value: string | number) => !!value

const ETAPAS_PIPELINE = [
  "Contactado",
  "En seguimiento",
  "Envié propuesta",
  "Cliente Convertido",
  "Seguimiento para cierre",
]
const QUE_BUSCA_OPTIONS = ["Alquiler", "Venta", "Compra cdo.", "Plan de Ahorro"]
const TIPO_PROPIEDAD_OPTIONS = [
  "Depto 3 amb.",
  "Oficina comercial",
  "PH",
  "Audi A3",
  "VW Polo Highline",
  "VW Amarok V6",
]
const ESTADO_OPTIONS = ["lead", "qualified", "customer", "inactive"]
const FUENTE_OPTIONS = ["WhatsApp", "Instagram", "LinkedIn", "Facebook"]

const fieldMap: Record<ColumnId, keyof Contact> = {
  contacto: "name",
  empresa: "company",
  vendedor: "vendedor",
  telefono: "phone",
  etapaPipeline: "etapaPipeline",
  queBusca: "queBusca",
  tipoPropiedad: "tipoPropiedad",
  zonaBarrio: "zonaBarrio",
  notas: "notas",
  estado: "status",
  score: "score",
  fuente: "source",
  ultimoContacto: "lastContact",
  acciones: "id",
  select: "id",
}
