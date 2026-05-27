"use client"

import { useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2 } from "lucide-react"
import { useBranchesStore } from "@/store/useBranchesStore"
import { useAppStore } from "@/store/useAppStore"
import { useIsOwner, usePermission } from "@/hooks/usePermission"
import { useTranslation } from "@/hooks/useTranslation"

const ALL = "__all__"

interface BranchFilterMenuProps {
  className?: string
}

export function BranchFilterMenu({ className }: BranchFilterMenuProps) {
  const { t } = useTranslation()
  const { branches, loaded, fetch } = useBranchesStore()
  const { filters, setFilters } = useAppStore()
  const isOwner = useIsOwner()
  const canViewAll = usePermission("branches.view_all")

  useEffect(() => {
    if (!loaded) fetch()
  }, [loaded, fetch])

  if (!isOwner && !canViewAll) return null
  if (loaded && branches.length === 0) return null

  const value = filters.sucursal_id ? String(filters.sucursal_id) : ALL

  return (
    <div className={className}>
      <Select
        value={value}
        onValueChange={(v) => setFilters({ sucursal_id: v === ALL ? null : Number(v) })}
      >
        <SelectTrigger className="w-[200px]">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <SelectValue placeholder={t("sucursales.filters.all")} />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("sucursales.filters.all")}</SelectItem>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={String(branch.id)}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
