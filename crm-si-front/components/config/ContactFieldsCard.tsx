"use client"

import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, Pencil, Plus, Trash2, GripVertical } from "lucide-react"

import { useTranslation } from "@/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/store/useAuthStore"
import { useContactFieldsStore } from "@/store/useContactFieldsStore"
import type { ContactField, ContactFieldType } from "@/lib/api/contact-fields"

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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

const TYPE_OPTIONS: ContactFieldType[] = [
  "text",
  "number",
  "date",
  "boolean",
  "select",
  "multi_select",
  "email",
  "url",
  "phone",
]

interface FormState {
  label: string
  type: ContactFieldType
  choices: string
  is_required: boolean
  is_unique: boolean
}

const emptyForm: FormState = {
  label: "",
  type: "text",
  choices: "",
  is_required: false,
  is_unique: false,
}

function needsOptions(type: ContactFieldType): boolean {
  return type === "select" || type === "multi_select"
}

export function ContactFieldsCard() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const permissions = useAuthStore((s) => s.permissions ?? [])
  const canView = permissions.includes("contact_fields.view") || permissions.includes("contact_fields.manage")
  const canManage = permissions.includes("contact_fields.manage")

  const { fields, loaded, loading, fetch, create, update, remove, reorder } = useContactFieldsStore()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ContactField | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (canView && !loaded) fetch()
  }, [canView, loaded, fetch])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (field: ContactField) => {
    setEditing(field)
    setForm({
      label: field.label,
      type: field.type,
      choices: (field.options?.choices ?? []).join("\n"),
      is_required: field.is_required,
      is_unique: field.is_unique,
    })
    setOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.label.trim()) return
    if (needsOptions(form.type)) {
      const parsed = form.choices.split("\n").map((c) => c.trim()).filter(Boolean)
      if (parsed.length === 0) {
        toast({ variant: "destructive", title: t("contactsPage.customFields.errors.optionsRequired") })
        return
      }
    }

    setSaving(true)
    const choices = form.choices.split("\n").map((c) => c.trim()).filter(Boolean)
    try {
      if (editing) {
        const result = await update(editing.id, {
          label: form.label.trim(),
          options: needsOptions(editing.type) ? { choices } : null,
          is_required: form.is_required,
          is_unique: form.is_unique,
        })
        if (result) {
          toast({ title: t("contactsPage.customFields.savedTitle") })
          setOpen(false)
        }
      } else {
        const result = await create({
          label: form.label.trim(),
          type: form.type,
          options: needsOptions(form.type) ? { choices } : null,
          is_required: form.is_required,
          is_unique: form.is_unique,
        })
        if (result) {
          toast({ title: t("contactsPage.customFields.savedTitle") })
          setOpen(false)
        }
      }
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (field: ContactField) => {
    if (!confirm(t("contactsPage.customFields.deleteConfirm").replace("{label}", field.label))) return
    const ok = await remove(field.id)
    if (ok) toast({ title: t("contactsPage.customFields.deletedTitle") })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = fields.findIndex((f) => f.id === active.id)
    const newIndex = fields.findIndex((f) => f.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const next = arrayMove(fields, oldIndex, newIndex)
    void reorder(next.map((f, i) => ({ id: f.id, display_order: i })))
  }

  const typeLabel = useMemo(
    () => (type: ContactFieldType) => t(`contactsPage.customFields.typeLabels.${type}`),
    [t],
  )

  if (!canView) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("contactsPage.customFields.title")}</CardTitle>
        {canManage ? (
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4 mr-1" />
            {t("contactsPage.customFields.addField")}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {loading && !loaded ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="animate-spin size-5 text-muted-foreground" />
          </div>
        ) : fields.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {t("contactsPage.customFields.empty")}
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {fields.map((field) => (
                  <SortableRow
                    key={field.id}
                    field={field}
                    canManage={canManage}
                    typeLabel={typeLabel(field.type)}
                    onEdit={() => openEdit(field)}
                    onDelete={() => onDelete(field)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing
                ? t("contactsPage.customFields.editTitle")
                : t("contactsPage.customFields.addField")}
            </DialogTitle>
            <DialogDescription>{t("contactsPage.customFields.dialogDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cf-label">{t("contactsPage.customFields.fieldLabel")}</Label>
              <Input
                id="cf-label"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cf-type">{t("contactsPage.customFields.fieldType")}</Label>
              <Select
                value={form.type}
                onValueChange={(value) => setForm((f) => ({ ...f, type: value as ContactFieldType }))}
                disabled={!!editing}
              >
                <SelectTrigger id="cf-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {typeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editing ? (
                <p className="text-xs text-muted-foreground">
                  {t("contactsPage.customFields.typeImmutable")}
                </p>
              ) : null}
            </div>

            {needsOptions(form.type) ? (
              <div className="space-y-2">
                <Label htmlFor="cf-choices">{t("contactsPage.customFields.options")}</Label>
                <textarea
                  id="cf-choices"
                  className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.choices}
                  onChange={(e) => setForm((f) => ({ ...f, choices: e.target.value }))}
                  placeholder={t("contactsPage.customFields.optionsPlaceholder")}
                />
              </div>
            ) : null}

            <div className="flex items-center justify-between">
              <Label htmlFor="cf-required">{t("contactsPage.customFields.required")}</Label>
              <Switch
                id="cf-required"
                checked={form.is_required}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_required: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="cf-unique">{t("contactsPage.customFields.unique")}</Label>
              <Switch
                id="cf-unique"
                checked={form.is_unique}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_unique: checked }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

interface SortableRowProps {
  field: ContactField
  canManage: boolean
  typeLabel: string
  onEdit: () => void
  onDelete: () => void
}

function SortableRow({ field, canManage, typeLabel, onEdit, onDelete }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-md border bg-card p-3"
    >
      {canManage ? (
        <button
          type="button"
          className="text-muted-foreground cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Reordenar"
        >
          <GripVertical className="size-4" />
        </button>
      ) : null}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{field.label}</span>
          <Badge variant="secondary" className="text-xs">
            {typeLabel}
          </Badge>
          {field.is_required ? <Badge variant="outline" className="text-xs">req</Badge> : null}
          {field.is_unique ? <Badge variant="outline" className="text-xs">único</Badge> : null}
        </div>
        <p className="text-xs text-muted-foreground truncate">{field.key}</p>
      </div>
      {canManage ? (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ) : null}
    </li>
  )
}
