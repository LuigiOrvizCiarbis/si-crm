"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, X, CalendarIcon, Bell, Paperclip } from "lucide-react"
import type { Task, TaskStatus, TaskPriority, TaskType } from "@/lib/types/task"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { useAppStore } from "@/store/useAppStore"
import { useTaskStore } from "@/store/useTaskStore"

interface NewTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateTask: (task: Partial<Task>) => void
}

export function NewTaskModal({ open, onOpenChange, onCreateTask }: NewTaskModalProps) {
  const leads = useAppStore((state) => state.leads)
  const conversaciones = useAppStore((state) => state.conversaciones)
  const addTask = useTaskStore((state) => state.addTask)

  const [name, setName] = useState("")
  const [status, setStatus] = useState<TaskStatus>("nuevo")
  const [priority, setPriority] = useState<TaskPriority>("media")
  const [type, setType] = useState<TaskType>("seguimiento")
  const [assignee, setAssignee] = useState("Martín")
  const [deadline, setDeadline] = useState<Date>()
  const [description, setDescription] = useState("")
  const [checklistItems, setChecklistItems] = useState<string[]>([])
  const [newChecklistItem, setNewChecklistItem] = useState("")
  const [recurrence, setRecurrence] = useState<string>("")
  const [relationType, setRelationType] = useState<"contact" | "pipeline" | "chat" | "none">("none")
  const [relationId, setRelationId] = useState<string>("")

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklistItems([...checklistItems, newChecklistItem])
      setNewChecklistItem("")
    }
  }

  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index))
  }

  const handleCreate = () => {
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

    if (!assignee) {
      toast.error("El responsable es requerido")
      return
    }

    if (!deadline) {
      toast.error("El deadline es requerido")
      return
    }

    let relatedTo: Task["relatedTo"] = undefined
    if (relationType !== "none" && relationId) {
      if (relationType === "contact" || relationType === "pipeline") {
        const lead = leads.find((l) => l.id === relationId)
        if (lead) {
          relatedTo = {
            kind: relationType,
            id: lead.id,
            label: `${lead.name} - ${lead.company}`,
          }
        }
      } else if (relationType === "chat") {
        const conv = conversaciones.find((c) => c.id === relationId)
        if (conv) {
          relatedTo = {
            kind: "chat",
            id: conv.id,
            label: `${conv.contacto} (${conv.canal})`,
          }
        }
      }
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      name: name.trim(),
      status,
      priority,
      type,
      assignee,
      deadline: deadline.toISOString(),
      description: description.trim(),
      relatedTo,
      checklist: checklistItems.map((item, idx) => ({
        id: `check-${Date.now()}-${idx}`,
        text: item,
        done: false,
      })),
      reminders: [],
      recurrence: recurrence || undefined,
      dependsOn: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedCalendars: [],
    }

    addTask(newTask)
    onCreateTask(newTask)
    toast.success("Tarea creada exitosamente")
    handleReset()
    onOpenChange(false)
  }

  const handleReset = () => {
    setName("")
    setStatus("nuevo")
    setPriority("media")
    setType("seguimiento")
    setAssignee("Martín")
    setDeadline(undefined)
    setDescription("")
    setChecklistItems([])
    setNewChecklistItem("")
    setRecurrence("")
    setRelationType("none")
    setRelationId("")
  }

  const getRelationOptions = () => {
    if (relationType === "contact" || relationType === "pipeline") {
      return leads.map((lead) => ({
        value: lead.id,
        label: `${lead.name} - ${lead.company}`,
      }))
    } else if (relationType === "chat") {
      return conversaciones.map((conv) => ({
        value: conv.id,
        label: `${conv.contacto} (${conv.canal})`,
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
                Responsable <span className="text-red-500">*</span>
              </Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Martín">Martín</SelectItem>
                  <SelectItem value="Valeria">Valeria</SelectItem>
                  <SelectItem value="Lucas">Lucas</SelectItem>
                  <SelectItem value="Sofia">Sofia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Deadline <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus />
                </PopoverContent>
              </Popover>
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
          <Button onClick={handleCreate}>Crear tarea</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
