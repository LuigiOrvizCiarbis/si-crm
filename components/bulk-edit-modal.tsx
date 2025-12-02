"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface BulkEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  onConfirm: (field: string, value: string) => void
}

export function BulkEditModal({ open, onOpenChange, selectedCount, onConfirm }: BulkEditModalProps) {
  const [field, setField] = useState<string>("vendedor")
  const [value, setValue] = useState<string>("")

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(field, value)
      setValue("")
      onOpenChange(false)
    }
  }

  const fieldOptions = [
    { value: "vendedor", label: "Vendedor" },
    { value: "etapaPipeline", label: "Etapa Pipeline" },
    { value: "status", label: "Estado" },
    { value: "source", label: "Fuente" },
    { value: "queBusca", label: "Qué Busca" },
    { value: "tipoPropiedad", label: "Tipo Prop./Vehículo" },
  ]

  const getValueInput = () => {
    switch (field) {
      case "etapaPipeline":
        return (
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Lead/Prospecto">Lead/Prospecto</SelectItem>
              <SelectItem value="Contactado">Contactado</SelectItem>
              <SelectItem value="En seguimiento">En seguimiento</SelectItem>
              <SelectItem value="Envié propuesta">Envié propuesta</SelectItem>
              <SelectItem value="Interesado">Interesado</SelectItem>
              <SelectItem value="Cliente Convertido">Cliente Convertido</SelectItem>
            </SelectContent>
          </Select>
        )
      case "status":
        return (
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="qualified">Calificado</SelectItem>
              <SelectItem value="customer">Cliente</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        )
      case "source":
        return (
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar fuente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
              <SelectItem value="Instagram">Instagram</SelectItem>
              <SelectItem value="Facebook">Facebook</SelectItem>
              <SelectItem value="LinkedIn">LinkedIn</SelectItem>
              <SelectItem value="Webform">Webform</SelectItem>
              <SelectItem value="Referido">Referido</SelectItem>
            </SelectContent>
          </Select>
        )
      case "queBusca":
        return (
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar opción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Alquiler">Alquiler</SelectItem>
              <SelectItem value="Venta">Venta</SelectItem>
              <SelectItem value="Compra cdo.">Compra cdo.</SelectItem>
              <SelectItem value="Plan de Ahorro">Plan de Ahorro</SelectItem>
            </SelectContent>
          </Select>
        )
      case "tipoPropiedad":
        return (
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Depto 1 amb.">Depto 1 amb.</SelectItem>
              <SelectItem value="Depto 2 amb.">Depto 2 amb.</SelectItem>
              <SelectItem value="Depto 3 amb.">Depto 3 amb.</SelectItem>
              <SelectItem value="PH">PH</SelectItem>
              <SelectItem value="Casa">Casa</SelectItem>
              <SelectItem value="Oficina comercial">Oficina comercial</SelectItem>
              <SelectItem value="Audi A3">Audi A3</SelectItem>
              <SelectItem value="VW Amarok V6">VW Amarok V6</SelectItem>
            </SelectContent>
          </Select>
        )
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ingresá el nuevo valor"
          />
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edición masiva</DialogTitle>
          <DialogDescription>
            Vas a actualizar <span className="font-bold text-foreground">{selectedCount}</span> contacto
            {selectedCount > 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Campo a editar</Label>
            <Select
              value={field}
              onValueChange={(val) => {
                setField(val)
                setValue("")
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nuevo valor</Label>
            {getValueInput()}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!value.trim()}>
            Aplicar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
