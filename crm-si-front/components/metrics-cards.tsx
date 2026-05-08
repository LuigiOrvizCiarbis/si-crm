"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DollarSign,
  MessageCircle,
  Target,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import type { DashboardKpis } from "@/lib/api/dashboard"

interface MetricsCardsProps {
  kpis?: DashboardKpis
  previous?: DashboardKpis
  trends?: Record<string, number>
  isLoading?: boolean
}

interface MetricCardProps {
  title: string
  value: string
  trend?: number
  previousLabel?: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  gradientFrom: string
  gradientTo: string
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-AR").format(Math.round(value))
}

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  }
  return `$${formatNumber(value)}`
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function MetricCard({
  title,
  value,
  trend,
  previousLabel,
  icon: Icon,
  iconBg,
  iconColor,
  gradientFrom,
  gradientTo,
}: MetricCardProps) {
  const isPositive = (trend ?? 0) >= 0

  return (
    <Card className="relative overflow-hidden border-border/50 hover:border-border transition-colors">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-5 pointer-events-none`}
      />
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${iconBg}`}
            >
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
          </div>
          {trend !== undefined && (
            <Badge
              variant="outline"
              className={`text-xs ${
                isPositive ? "border-green-500/30 text-green-500" : "border-red-500/30 text-red-500"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3 mr-1 inline" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 inline" />
              )}
              {trend > 0 ? "+" : ""}
              {trend}%
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-3xl font-bold tabular-nums">{value}</p>
          {previousLabel && (
            <p className="text-xs text-muted-foreground">{previousLabel}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingMetricCard() {
  return (
    <Card className="border-border/50">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-5 w-14" />
        </div>
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-3 w-40" />
      </CardContent>
    </Card>
  )
}

export function MetricsCards({ kpis, previous, trends, isLoading }: MetricsCardsProps) {
  const { t } = useTranslation()

  if (isLoading || !kpis || !previous || !trends) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <LoadingMetricCard />
        <LoadingMetricCard />
        <LoadingMetricCard />
        <LoadingMetricCard />
      </div>
    )
  }

  const previousLabel = (rawValue: number | string): string =>
    t("dashboard.kpis.vsPrevious").replace("{value}", String(rawValue))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title={t("dashboard.kpis.totalConversations")}
        value={formatNumber(kpis.total_conversations)}
        trend={trends.total_conversations}
        previousLabel={previousLabel(formatNumber(previous.total_conversations))}
        icon={MessageCircle}
        iconBg="bg-cyan-500/15"
        iconColor="text-cyan-400"
        gradientFrom="from-cyan-500"
        gradientTo="to-blue-500"
      />
      <MetricCard
        title={t("dashboard.kpis.totalRevenue")}
        value={formatCurrency(kpis.won_value || kpis.pipeline_value)}
        trend={trends.won_value ?? trends.pipeline_value}
        previousLabel={previousLabel(formatCurrency(previous.won_value || previous.pipeline_value))}
        icon={DollarSign}
        iconBg="bg-emerald-500/15"
        iconColor="text-emerald-400"
        gradientFrom="from-emerald-500"
        gradientTo="to-green-500"
      />
      <MetricCard
        title={t("dashboard.kpis.globalConversion")}
        value={formatPercent(kpis.global_conversion_rate)}
        trend={trends.global_conversion_rate}
        previousLabel={previousLabel(formatPercent(previous.global_conversion_rate))}
        icon={Target}
        iconBg="bg-violet-500/15"
        iconColor="text-violet-400"
        gradientFrom="from-violet-500"
        gradientTo="to-purple-500"
      />
      <MetricCard
        title={t("dashboard.kpis.avgRoi")}
        value={formatPercent(kpis.avg_roi)}
        trend={trends.avg_roi}
        previousLabel={previousLabel(formatPercent(previous.avg_roi))}
        icon={TrendingUp}
        iconBg="bg-orange-500/15"
        iconColor="text-orange-400"
        gradientFrom="from-orange-500"
        gradientTo="to-amber-500"
      />
    </div>
  )
}
