"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  CalendarIcon,
  Phone,
  Video,
  FileText,
  MapPin,
  HeadphonesIcon,
  Eye,
  Edit2,
  Trash2,
  Check,
  X,
  ExternalLink,
} from "lucide-react"
import type { Task } from "@/lib/types/task"
import { format } from "date-fns"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const taskTypeIcons = {
  reunion: Video,
  llamado: Phone,
  demo: Video,
  propuesta: FileText,
  visita: MapPin,
  seguimiento: CalendarIcon,
  soporte: HeadphonesIcon,
}

const statusColors = {
  nuevo: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "en-curso": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "en-espera": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  reprogramado: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  bloqueado: "bg-red-500/20 text-red-400 border-red-500/30",
  hecho: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  cancelado: "bg-gray-500/20 text-gray-400 border-gray-500/30",
}

const priorityColors = {
  baja: "bg-gray-500/20 text-gray-300",
  media: "bg-blue-500/20 text-blue-300",
  alta: "bg-orange-500/20 text-orange-300",
  critica: "bg-red-500/20 text-red-300",
}

export function TaskListView({ tasks }: { tasks: Task[] }) {
  const [editingCell, setEditingCell] = useState<{ taskId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState("")
  const [localTasks, setLocalTasks] = useState(tasks)
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const router = useRouter()
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [bulkField, setBulkField] = useState<"status" | "priority" | "assignee" | "deadline">("status")
  const [bulkValue, setBulkValue] = useState("")

  // Autosave with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (editingCell) {
        handleSave()
      }
    }, 600)

    return () => clearTimeout(timeoutId)
  }, [editValue])

  const handleEdit = (taskId: string, field: string, currentValue: string) => {
    setEditingCell({ taskId, field })
    setEditValue(currentValue)
  }

  const handleSave = () => {
    if (!editingCell) return

    const { taskId, field } = editingCell

    // Optimistic update
    setLocalTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              [field]: editValue,
              updatedAt: new Date().toISOString(),
            }
          : task,
      ),
    )

    setEditingCell(null)
    toast.success("Tarea actualizada")
  }

  const handleCancel = () => {
    setEditingCell(null)
    setEditValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  const handleStatusChange = (taskId: string, newStatus: Task["status"]) => {
    setLocalTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus,
              completedAt: newStatus === "hecho" ? new Date().toISOString() : task.completedAt,
              updatedAt: new Date().toISOString(),
            }
          : task,
      ),
    )
    toast.success(`Estado cambiado a "${newStatus}"`)
  }

  const handleMarkDone = (taskId: string) => {
    handleStatusChange(taskId, "hecho")
  }

  const handleRelatedClick = (relation: Task["relatedTo"]) => {
    if (!relation) return

    if (relation.kind === "contact") {
      router.push(`/contactos?id=${relation.id}`)
    } else if (relation.kind === "pipeline") {
      router.push(`/oportunidades?id=${relation.id}`)
    } else if (relation.kind === "chat") {
      router.push(`/chats?conversation=${relation.id}`)
    }
  }

  const toggleSelection = (taskId: string) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedTasks.size === localTasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(localTasks.map((t) => t.id)))
    }
  }

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  const handleBulkEdit = () => {
    if (selectedTasks.size === 0) return

    setLocalTasks((prev) =>
      prev.map((task) => {
        if (selectedTasks.has(task.id)) {
          return {
            ...task,
            [bulkField]: bulkValue,
            updatedAt: new Date().toISOString(),
          }
        }
        return task
      }),
    )

    toast.success(`${selectedTasks.size} tarea(s) actualizadas`, {
      action: {
        label: "Deshacer",
        onClick: () => {
          setLocalTasks(tasks)
          toast.success("Cambios revertidos")
        },
      },
      duration: 5000,
    })

    setShowBulkEdit(false)
    setSelectedTasks(new Set())
  }

  const handleBulkMarkDone = () => {
    if (selectedTasks.size === 0) return

    setLocalTasks((prev) =>
      prev.map((task) => {
        if (selectedTasks.has(task.id)) {
          return {
            ...task,
            status: "hecho",
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        }
        return task
      }),
    )

    toast.success(`${selectedTasks.size} tarea(s) marcadas como completadas`)
    setSelectedTasks(new Set())
  }

  return (
    <TooltipProvider>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedTasks.size === localTasks.length && localTasks.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-12">Tipo</TableHead>
              <TableHead className="min-w-[250px]">Nombre de tarea</TableHead>
              <TableHead className="w-[120px]">Estado</TableHead>
              <TableHead className="w-[130px]">Deadline</TableHead>
              <TableHead className="w-[100px]">Prioridad</TableHead>
              <TableHead className="w-[110px]">Tipo</TableHead>
              <TableHead className="w-[140px]">Responsable</TableHead>
              <TableHead className="w-[200px]">Relacionado con</TableHead>
              <TableHead className="w-[120px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localTasks.map((task) => {
              const TypeIcon = taskTypeIcons[task.type]
              const isEditing = editingCell?.taskId === task.id

              return (
                <TableRow key={task.id} className="hover:bg-muted/30 border-b border-border/50">
                  {/* Checkbox */}
                  <TableCell>
                    <Checkbox checked={selectedTasks.has(task.id)} onCheckedChange={() => toggleSelection(task.id)} />
                  </TableCell>

                  {/* Icon */}
                  <TableCell>
                    <TypeIcon className="w-4 h-4 text-muted-foreground" />
                  </TableCell>

                  {/* Name - Editable */}
                  <TableCell>
                    {isEditing && editingCell.field === "name" ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="h-8 text-sm"
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave}>
                          <Check className="h-4 w-4 text-emerald-500" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancel}>
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <span className="font-medium text-foreground">{task.name}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => handleEdit(task.id, "name", task.name)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>

                  {/* Status - Select */}
                  <TableCell>
                    <Select
                      value={task.status}
                      onValueChange={(val) => handleStatusChange(task.id, val as Task["status"])}
                    >
                      <SelectTrigger className={`h-7 text-xs ${statusColors[task.status]}`}>
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
                  </TableCell>

                  {/* Deadline */}
                  <TableCell>
                    {task.deadline ? (
                      <div
                        className={`text-sm ${isOverdue(task.deadline) && task.status !== "hecho" ? "text-red-400 font-semibold" : "text-muted-foreground"}`}
                      >
                        {format(new Date(task.deadline), "dd/MM/yyyy")}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin fecha</span>
                    )}
                  </TableCell>

                  {/* Priority */}
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${priorityColors[task.priority]}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                  </TableCell>

                  {/* Type */}
                  <TableCell>
                    <Badge variant="outline" className="text-xs bg-muted/50">
                      {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                    </Badge>
                  </TableCell>

                  {/* Assignee */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                          {task.assignee
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">{task.assignee}</span>
                    </div>
                  </TableCell>

                  {/* Related To */}
                  <TableCell>
                    {task.relatedTo ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 hover:bg-primary/10"
                            onClick={() => handleRelatedClick(task.relatedTo)}
                          >
                            <span className="truncate max-w-[150px]">{task.relatedTo.label}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Ver{" "}
                            {task.relatedTo.kind === "contact"
                              ? "contacto"
                              : task.relatedTo.kind === "pipeline"
                                ? "oportunidad"
                                : "chat"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin relación</span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleMarkDone(task.id)}
                            disabled={task.status === "hecho"}
                          >
                            <Check className="h-4 w-4 text-emerald-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Marcar como Hecho</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7">
                            <Eye className="h-4 w-4 text-blue-400" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver detalles</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7">
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Eliminar</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {selectedTasks.size > 0 && (
          <div className="border-t border-border p-3 bg-muted/30 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{selectedTasks.size} tarea(s) seleccionada(s)</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowBulkEdit(true)}>
                Editar en lote
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkMarkDone}>
                Marcar Hecho
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedTasks(new Set())}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Edit Modal */}
      <Dialog open={showBulkEdit} onOpenChange={setShowBulkEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar en lote</DialogTitle>
            <DialogDescription>Aplicar cambios a {selectedTasks.size} tarea(s) seleccionada(s)</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Campo a editar</Label>
              <Select value={bulkField} onValueChange={(val) => setBulkField(val as typeof bulkField)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Estado</SelectItem>
                  <SelectItem value="priority">Prioridad</SelectItem>
                  <SelectItem value="assignee">Responsable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nuevo valor</Label>
              {bulkField === "status" && (
                <Select value={bulkValue} onValueChange={setBulkValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nuevo">Nuevo</SelectItem>
                    <SelectItem value="en-curso">En curso</SelectItem>
                    <SelectItem value="en-espera">En espera</SelectItem>
                    <SelectItem value="hecho">Hecho</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {bulkField === "priority" && (
                <Select value={bulkValue} onValueChange={setBulkValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {bulkField === "assignee" && (
                <Select value={bulkValue} onValueChange={setBulkValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar responsable" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Martín">Martín</SelectItem>
                    <SelectItem value="Valeria">Valeria</SelectItem>
                    <SelectItem value="Lucas">Lucas</SelectItem>
                    <SelectItem value="Sofia">Sofia</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkEdit(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBulkEdit} disabled={!bulkValue}>
              Aplicar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
