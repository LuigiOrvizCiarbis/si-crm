"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/hooks/useTranslation"
import type { DashboardStage } from "@/lib/api/dashboard"

interface SalesFunnelProps {
  stages?: DashboardStage[]
  isLoading?: boolean
}

const STAGE_COLORS = [
  "bg-blue-500",
  "bg-cyan-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-amber-500",
  "bg-emerald-500",
]

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  }
  return `$${new Intl.NumberFormat("es-AR").format(Math.round(value))}`
}

export function SalesFunnel({ stages, isLoading }: SalesFunnelProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("dashboard.funnel.title")}</CardTitle>
        <span className="text-sm text-muted-foreground">{t("dashboard.funnel.realtime")}</span>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-full rounded-full" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!stages || stages.length === 0) && (
          <div className="py-8 text-center space-y-2">
            <p className="text-sm font-medium text-foreground">{t("dashboard.funnel.noStages")}</p>
            <p className="text-xs text-muted-foreground">{t("dashboard.funnel.configureStages")}</p>
          </div>
        )}

        {!isLoading && stages && stages.length > 0 && (
          <div className="space-y-5">
            {stages.map((stage, idx) => {
              const total = stages[0]?.count ?? 0
              const percentage = total > 0 ? Math.round((stage.count / total) * 100) : 0
              const color = STAGE_COLORS[idx % STAGE_COLORS.length]
              const leadsLabel = t("dashboard.funnel.leads").replace("{count}", String(stage.count))
              const widthPercent = Math.max(percentage, 2)

              return (
                <div key={stage.id} className="space-y-2.5">
                  <div className="grid gap-2 text-sm font-medium sm:grid-cols-[minmax(0,1fr)_7rem_7rem_4rem] sm:items-center">
                    <span className="min-w-0 truncate text-foreground" title={stage.name}>
                      {stage.name}
                    </span>
                    <span className="text-muted-foreground tabular-nums sm:text-right">{leadsLabel}</span>
                    <span className="tabular-nums sm:text-right">{formatCurrency(stage.value)}</span>
                    <span className="text-muted-foreground tabular-nums sm:text-right">{percentage}%</span>
                  </div>
                  <div
                    className="h-3 w-full overflow-hidden rounded-full bg-muted"
                    aria-label={`${stage.name}: ${leadsLabel}, ${formatCurrency(stage.value)}, ${percentage}%`}
                  >
                    <div
                      className={`h-full rounded-full ${color} transition-all duration-500`}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
