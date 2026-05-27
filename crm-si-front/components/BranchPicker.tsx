"use client"

import { useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useBranchesStore } from "@/store/useBranchesStore"
import { useTranslation } from "@/hooks/useTranslation"

interface BranchPickerProps {
  value: number | null | undefined
  onChange: (value: number | null) => void
  label?: string
  disabled?: boolean
  nullable?: boolean
  hideIfEmpty?: boolean
  className?: string
}

const NONE = "__none__"

export function BranchPicker({
  value,
  onChange,
  label,
  disabled,
  nullable = true,
  hideIfEmpty = true,
  className,
}: BranchPickerProps) {
  const { t } = useTranslation()
  const { branches, loaded, fetch } = useBranchesStore()

  useEffect(() => {
    if (!loaded) fetch()
  }, [loaded, fetch])

  if (hideIfEmpty && loaded && branches.length === 0) {
    return null
  }

  const activeBranches = branches.filter((b) => b.is_active || b.id === value)

  return (
    <div className={className}>
      {label !== undefined && <Label className="mb-1 block">{label || t("sucursales.title")}</Label>}
      <Select
        value={value ? String(value) : NONE}
        onValueChange={(v) => onChange(v === NONE ? null : Number(v))}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={t("sucursales.pickerPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {nullable && (
            <SelectItem value={NONE}>{t("sucursales.filters.none")}</SelectItem>
          )}
          {activeBranches.map((branch) => (
            <SelectItem key={branch.id} value={String(branch.id)}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
