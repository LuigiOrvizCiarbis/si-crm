"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import { useToast } from "@/components/Toast"
import { useBranchesStore } from "@/store/useBranchesStore"
import { Branch, BranchPayload } from "@/lib/api/branches"

interface SucursalFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  branch?: Branch | null
  onSaved?: () => void
}

export function SucursalForm({ open, onOpenChange, branch, onSaved }: SucursalFormProps) {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { create, update } = useBranchesStore()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<BranchPayload>({
    name: "",
    address: "",
    phone: "",
    email: "",
    timezone: "",
    is_active: true,
  })

  useEffect(() => {
    if (branch) {
      setForm({
        name: branch.name,
        address: branch.address || "",
        phone: branch.phone || "",
        email: branch.email || "",
        timezone: branch.timezone || "",
        is_active: branch.is_active,
      })
    } else {
      setForm({ name: "", address: "", phone: "", email: "", timezone: "", is_active: true })
    }
  }, [branch, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name?.trim()) {
      addToast({
        title: t("common.error"),
        description: t("sucursales.errors.name_required"),
        type: "error",
      })
      return
    }

    setSaving(true)
    const payload: BranchPayload = {
      ...form,
      address: form.address || null,
      phone: form.phone || null,
      email: form.email || null,
      timezone: form.timezone || null,
    }

    const result = branch ? await update(branch.id, payload) : await create(payload)
    setSaving(false)

    if (!result) {
      addToast({
        title: t("common.error"),
        description: useBranchesStore.getState().error || "",
        type: "error",
      })
      return
    }

    addToast({ type: "success", title: branch ? t("sucursales.updated") : t("sucursales.created") })
    onOpenChange(false)
    onSaved?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{branch ? t("sucursales.edit") : t("sucursales.create")}</DialogTitle>
          <DialogDescription>{t("sucursales.subtitle")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("sucursales.fields.name")} *</Label>
            <Input
              id="name"
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t("sucursales.fields.address")}</Label>
            <Input
              id="address"
              value={form.address || ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              maxLength={255}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phone">{t("sucursales.fields.phone")}</Label>
              <Input
                id="phone"
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                maxLength={40}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("sucursales.fields.email")}</Label>
              <Input
                id="email"
                type="email"
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">{t("sucursales.fields.timezone")}</Label>
            <Input
              id="timezone"
              placeholder="America/Argentina/Buenos_Aires"
              value={form.timezone || ""}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              maxLength={64}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="is_active" className="cursor-pointer">
              {t("sucursales.fields.is_active")}
            </Label>
            <Switch
              id="is_active"
              checked={!!form.is_active}
              onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
