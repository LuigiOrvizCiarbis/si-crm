"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string
  subtitle?: string
  primaryCtaLabel?: string
  onPrimaryCta?: () => void
  searchValue?: string
  onSearchChange?: (value: string) => void
  filtersSlot?: ReactNode
  className?: string
}

export function SectionHeader({
  title,
  subtitle,
  primaryCtaLabel,
  onPrimaryCta,
  searchValue,
  onSearchChange,
  filtersSlot,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("sticky top-0 z-10 bg-background border-b border-border", className)}>
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {primaryCtaLabel && onPrimaryCta && (
          <Button onClick={onPrimaryCta} className="gap-2">
            <Plus className="h-4 w-4" />
            {primaryCtaLabel}
          </Button>
        )}
      </div>

      {(onSearchChange || filtersSlot) && (
        <div className="flex items-center gap-3 px-6 pb-4">
          {onSearchChange && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar..."
                value={searchValue || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
          {filtersSlot && <div className="flex items-center gap-2">{filtersSlot}</div>}
        </div>
      )}
    </div>
  )
}
