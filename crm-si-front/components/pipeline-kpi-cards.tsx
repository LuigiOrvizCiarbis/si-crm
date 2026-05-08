"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Briefcase, DollarSign, Target, TrendingUp, type LucideIcon } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import { getOpportunitySummary, type OpportunitySummary } from "@/lib/api/opportunities"

interface PipelineKpiCardsProps {
  refreshKey?: number
}

interface KpiCardProps {
  title: string
  value: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  gradientFrom: string
  gradientTo: string
}

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  }
  return `$${new Intl.NumberFormat("es-AR").format(Math.round(value))}`
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-AR").format(Math.round(value))
}

function KpiCard({ title, value, icon: Icon, iconBg, iconColor, gradientFrom, gradientTo }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden border-border/50 hover:border-border transition-colors">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-5 pointer-events-none`} />
      <CardContent className="p-5 relative">
        <div className="flex items-center gap-3 mb-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
        </div>
        <p className="text-3xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}

function LoadingKpi() {
  return (
    <Card className="border-border/50">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-24" />
      </CardContent>
    </Card>
  )
}

export function PipelineKpiCards({ refreshKey = 0 }: PipelineKpiCardsProps) {
  const { t } = useTranslation()
  const [data, setData] = useState<OpportunitySummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    getOpportunitySummary()
      .then((summary) => {
        if (!cancelled) setData(summary)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [refreshKey])

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <LoadingKpi />
        <LoadingKpi />
        <LoadingKpi />
        <LoadingKpi />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title={t("pipeline.kpis.totalOpportunities")}
        value={formatNumber(data.total_opportunities)}
        icon={Briefcase}
        iconBg="bg-cyan-500/15"
        iconColor="text-cyan-400"
        gradientFrom="from-cyan-500"
        gradientTo="to-blue-500"
      />
      <KpiCard
        title={t("pipeline.kpis.pipelineValue")}
        value={formatCurrency(data.pipeline_value)}
        icon={DollarSign}
        iconBg="bg-emerald-500/15"
        iconColor="text-emerald-400"
        gradientFrom="from-emerald-500"
        gradientTo="to-green-500"
      />
      <KpiCard
        title={t("pipeline.kpis.weightedValue")}
        value={formatCurrency(data.weighted_value)}
        icon={Target}
        iconBg="bg-violet-500/15"
        iconColor="text-violet-400"
        gradientFrom="from-violet-500"
        gradientTo="to-purple-500"
      />
      <KpiCard
        title={t("pipeline.kpis.avgValue")}
        value={formatCurrency(data.avg_value)}
        icon={TrendingUp}
        iconBg="bg-orange-500/15"
        iconColor="text-orange-400"
        gradientFrom="from-orange-500"
        gradientTo="to-amber-500"
      />
    </div>
  )
}
