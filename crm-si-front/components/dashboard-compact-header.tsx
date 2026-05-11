"use client"

import { LayoutDashboard } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslation } from "@/hooks/useTranslation"
import type { DashboardPeriodo } from "@/lib/api/dashboard"

interface DashboardCompactHeaderProps {
  vista: string
  onVistaChange: (value: string) => void
  periodo: DashboardPeriodo
  onPeriodoChange: (value: DashboardPeriodo) => void
  canal: string
  onCanalChange: (value: string) => void
}

export function DashboardCompactHeader({
  vista,
  onVistaChange,
  periodo,
  onPeriodoChange,
  canal,
  onCanalChange,
}: DashboardCompactHeaderProps) {
  const { t } = useTranslation()

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex flex-col gap-3 px-4 md:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-semibold">{t("dashboard.title")}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={vista} onValueChange={onVistaChange}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder={t("dashboard.filters.view")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dueno">{t("dashboard.filters.owner")}</SelectItem>
              <SelectItem value="sucursal-centro">{t("dashboard.filters.branchCenter")}</SelectItem>
              <SelectItem value="sucursal-norte">{t("dashboard.filters.branchNorth")}</SelectItem>
              <SelectItem value="equipo-ventas">{t("dashboard.filters.salesTeam")}</SelectItem>
              <SelectItem value="equipo-marketing">{t("dashboard.filters.marketingTeam")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={periodo} onValueChange={(value) => onPeriodoChange(value as DashboardPeriodo)}>
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue placeholder={t("dashboard.filters.period")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoy">{t("dashboard.filters.today")}</SelectItem>
              <SelectItem value="esta-semana">{t("dashboard.filters.thisWeek")}</SelectItem>
              <SelectItem value="este-mes">{t("dashboard.filters.thisMonth")}</SelectItem>
              <SelectItem value="este-trimestre">{t("dashboard.filters.thisQuarter")}</SelectItem>
              <SelectItem value="este-ano">{t("dashboard.filters.thisYear")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={canal} onValueChange={onCanalChange}>
            <SelectTrigger className="w-[130px] h-9 text-sm">
              <SelectValue placeholder={t("dashboard.filters.channel")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">{t("dashboard.filters.all")}</SelectItem>
              <SelectItem value="whatsapp">{t("dashboard.filters.whatsapp")}</SelectItem>
              <SelectItem value="instagram">{t("dashboard.filters.instagram")}</SelectItem>
              <SelectItem value="telegram">{t("dashboard.filters.telegram")}</SelectItem>
              <SelectItem value="email">{t("dashboard.filters.email")}</SelectItem>
              <SelectItem value="web">{t("dashboard.filters.web")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
