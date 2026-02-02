"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"

export function CreateTaskDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Tarea
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Tarea</DialogTitle>
          <DialogDescription>Crea una nueva tarea y asígnala a un lead o oportunidad.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" placeholder="Ej: Llamada de seguimiento" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" placeholder="Describe los detalles de la tarea..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llamada">Llamada</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="reunion">Reunión</SelectItem>
                  <SelectItem value="seguimiento">Seguimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Fecha de vencimiento</Label>
              <Input id="dueDate" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assignee">Asignar a</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="juan">Juan Pérez</SelectItem>
                  <SelectItem value="ana">Ana López</SelectItem>
                  <SelectItem value="roberto">Roberto Silva</SelectItem>
                  <SelectItem value="laura">Laura Fernández</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lead">Lead/Oportunidad</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar lead" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maria">María González - Tech Solutions</SelectItem>
                <SelectItem value="carlos">Carlos Rodríguez - Innovate Corp</SelectItem>
                <SelectItem value="ana">Ana Martínez - Digital Agency</SelectItem>
                <SelectItem value="diego">Diego Morales - Retail Group</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => setOpen(false)}>Crear Tarea</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
