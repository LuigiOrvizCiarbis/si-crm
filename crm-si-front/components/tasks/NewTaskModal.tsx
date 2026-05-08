"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, X, CalendarIcon, Bell, Paperclip } from "lucide-react"
import type { Task, TaskStatus, TaskPriority, TaskType } from "@/lib/types/task"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { useTaskStore } from "@/store/useTaskStore"
import { getUsers, type SystemUser } from "@/lib/api/users"
import { getContacts, type Contact } from "@/lib/api/contacts"
import { getOpportunities } from "@/lib/api/opportunities"
import { getConversations } from "@/lib/api/conversations"

interface PrefilledData {
  relationType?: "contact" | "pipeline" | "chat" | "none"
  relationId?: string
  relationLabel?: string
  type?: TaskType
  assignee?: string
  name?: string
  description?: string
}

interface NewTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateTask: (task: Partial<Task>) => void
  prefilledData?: PrefilledData
}

const numericIdOrNull = (id: string) => {
  const numericId = Number(id)
  return Number.isInteger(numericId) && numericId > 0 ? numericId : null
}

export function NewTaskModal({ open, onOpenChange, onCreateTask, prefilledData }: NewTaskModalProps) {
  const addTask = useTaskStore((state) => state.addTask)

  const [name, setName] = useState("")
  const [status, setStatus] = useState<TaskStatus>("nuevo")
  const [priority, setPriority] = useState<TaskPriority>("media")
  const [type, setType] = useState<TaskType>("seguimiento")
  const [assigneeId, setAssigneeId] = useState("none")
  const [users, setUsers] = useState<SystemUser[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [deadline, setDeadline] = useState<Date>()
  const [description, setDescription] = useState("")
  const [checklistItems, setChecklistItems] = useState<string[]>([])
  const [newChecklistItem, setNewChecklistItem] = useState("")
  const [recurrence, setRecurrence] = useState<string>("")
  const [relationType, setRelationType] = useState<"contact" | "pipeline" | "chat" | "none">("none")
  const [relationId, setRelationId] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return

    getUsers().then(setUsers)
    getContacts().then(setContacts).catch(() => setContacts([]))
    getOpportunities().then(setOpportunities).catch(() => setOpportunities([]))
    getConversations().then(setConversations).catch(() => setConversations([]))
  }, [open])

  // Apply prefilled data when modal opens
  useEffect(() => {
    if (open && prefilledData) {
      if (prefilledData.type) setType(prefilledData.type)
      if (prefilledData.assignee) {
        const user = users.find((item) => item.name === prefilledData.assignee)
        if (user) setAssigneeId(String(user.id))
      }
      if (prefilledData.name) setName(prefilledData.name)
      if (prefilledData.description) setDescription(prefilledData.description)
      if (prefilledData.relationType) setRelationType(prefilledData.relationType)
      if (prefilledData.relationId) setRelationId(prefilledData.relationId)
    }
  }, [open, prefilledData, users])

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklistItems([...checklistItems, newChecklistItem])
      setNewChecklistItem("")
    }
  }

  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index))
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("El nombre de la tarea es requerido")
      return
    }

    if (!type) {
      toast.error("El tipo de tarea es requerido")
      return
    }

    if (!status) {
      toast.error("El estado es requerido")
      return
    }

    if (!deadline) {
      toast.error("El deadline es requerido")
      return
    }

    const relatedId = numericIdOrNull(relationId)
    const payload = {
      name: name.trim(),
      status,
      priority,
      type,
      assigned_to: assigneeId === "none" ? null : Number(assigneeId),
      deadline: deadline.toISOString(),
      description: description.trim(),
      checklist: checklistItems.map((item, idx) => ({
        id: `check-${Date.now()}-${idx}`,
        text: item,
        done: false,
      })),
      reminders: [],
      recurrence: recurrence === "none" ? null : recurrence || null,
      depends_on: [],
      attachments: [],
      synced_calendars: [],
      ...(relationType === "contact" && relatedId ? { contact_id: relatedId } : {}),
      ...(relationType === "pipeline" && relatedId ? { opportunity_id: relatedId } : {}),
      ...(relationType === "chat" && relatedId ? { conversation_id: relatedId } : {}),
    }

    try {
      setIsSaving(true)
      const createdTask = await addTask(payload)
      onCreateTask(createdTask)
      toast.success("Tarea creada exitosamente")
      handleReset()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la tarea")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setName("")
    setStatus("nuevo")
    setPriority("media")
    setType("seguimiento")
    setAssigneeId("none")
    setDeadline(undefined)
    setDescription("")
    setChecklistItems([])
    setNewChecklistItem("")
    setRecurrence("")
    setRelationType("none")
    setRelationId("")
  }

  const getRelationOptions = () => {
    if (relationType === "contact") {
      return contacts.map((contact) => ({
        value: String(contact.id),
        label: contact.name,
      }))
    } else if (relationType === "pipeline") {
      return opportunities.map((opportunity) => ({
        value: String(opportunity.id),
        label: opportunity.title ?? `Oportunidad #${opportunity.id}`,
      }))
    } else if (relationType === "chat") {
      return conversations.map((conversation) => ({
        value: String(conversation.id),
        label: `${conversation.contact?.name ?? "Chat"}${conversation.channel?.name ? ` (${conversation.channel.name})` : ""}`,
      }))
    }
    return []
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Tarea</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ej: Llamar a cliente..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Type, Status, Priority */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>
                Tipo <span className="text-red-500">*</span>
              </Label>
              <Select value={type} onValueChange={(val) => setType(val as TaskType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reunion">Reunión</SelectItem>
                  <SelectItem value="llamado">Llamado</SelectItem>
                  <SelectItem value="demo">Demo</SelectItem>
                  <SelectItem value="propuesta">Propuesta</SelectItem>
                  <SelectItem value="seguimiento">Seguimiento</SelectItem>
                  <SelectItem value="soporte">Soporte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Estado <span className="text-red-500">*</span>
              </Label>
              <Select value={status} onValueChange={(val) => setStatus(val as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nuevo">Nuevo</SelectItem>
                  <SelectItem value="en-curso">En curso</SelectItem>
                  <SelectItem value="en-espera">En espera</SelectItem>
                  <SelectItem value="reprogramado">Reprogramado</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                  <SelectItem value="hecho">Hecho</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={(val) => setPriority(val as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee and Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">
                Responsable
              </Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Deadline <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={deadline ? format(deadline, "yyyy-MM-dd") : ""}
                  onChange={(event) => {
                    if (!event.target.value) {
                      setDeadline(undefined)
                      return
                    }

                    setDeadline(new Date(`${event.target.value}T12:00:00`))
                  }}
                  className="h-10 pl-10"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Detalles de la tarea..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Relacionado con</Label>
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={relationType}
                onValueChange={(val) => {
                  setRelationType(val as any)
                  setRelationId("") // Reset selection when type changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ninguno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  <SelectItem value="contact">Contacto</SelectItem>
                  <SelectItem value="pipeline">Lead/Oportunidad</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                </SelectContent>
              </Select>

              {relationType !== "none" && (
                <Select value={relationId} onValueChange={setRelationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getRelationOptions().map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <Label>Checklist</Label>
            <div className="space-y-2">
              {checklistItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Checkbox disabled />
                  <span className="flex-1 text-sm">{item}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => handleRemoveChecklistItem(idx)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              <div className="flex gap-2">
                <Input
                  placeholder="Agregar ítem..."
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddChecklistItem()}
                />
                <Button size="icon" onClick={handleAddChecklistItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <Label>Recurrencia</Label>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger>
                <SelectValue placeholder="Sin recurrencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin recurrencia</SelectItem>
                <SelectItem value="FREQ=DAILY">Diario</SelectItem>
                <SelectItem value="FREQ=WEEKLY">Semanal</SelectItem>
                <SelectItem value="FREQ=MONTHLY">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Secondary actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Bell className="w-4 h-4" />
              Recordatorios
            </Button>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Paperclip className="w-4 h-4" />
              Adjuntar
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isSaving}>
            {isSaving ? "Creando..." : "Crear tarea"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
