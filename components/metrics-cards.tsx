"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useDashboardStore } from "@/store/useDashboardStore"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
import { LineChart, Line } from "recharts"

interface MetricCardProps {
  title: string
  value: number
  conversionRate?: string
  trend?: string
  sparklineData: number[]
  gradientFrom?: string
  gradientTo?: string
}

function MetricCard({
  title,
  value,
  conversionRate,
  trend,
  sparklineData,
  gradientFrom = "from-cyan-500",
  gradientTo = "to-blue-500",
}: MetricCardProps) {
  const trendValue = Number.parseFloat(trend || "0")
  const isPositive = trendValue >= 0

  // Prepare sparkline data for recharts
  const chartData = sparklineData.map((val, idx) => ({ value: val, index: idx }))

  return (
    <Card className="relative overflow-hidden border-border/50 hover:border-border transition-colors">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-5`} />
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {trend && (
            <Badge
              variant="outline"
              className={`text-xs ${isPositive ? "border-green-500/30 text-green-500" : "border-red-500/30 text-red-500"}`}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3 mr-1 inline" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 inline" />
              )}
              {trendValue > 0 ? "+" : ""}
              {trendValue}%
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-3xl font-bold tabular-nums">{value}</p>

          {conversionRate && (
            <Badge variant="secondary" className="text-xs font-medium">
              {conversionRate}% conversión
            </Badge>
          )}
        </div>

        {/* Mini sparkline */}
        <div className="mt-3 h-8 -mx-2">
          <LineChart width={200} height={32} data={chartData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="currentColor"
              strokeWidth={1.5}
              dot={false}
              className="text-cyan-500"
            />
          </LineChart>
        </div>
      </CardContent>
    </Card>
  )
}

export function MetricsCards() {
  const { targets, conversions, trends, dailySeries } = useDashboardStore()

  // Extract last 30 days for sparklines
  const leadsSparkline = dailySeries.map((d) => d.leads)
  const contactadosSparkline = dailySeries.map((d) => d.contactados)
  const seguimientoSparkline = dailySeries.map((d) => d.seguimiento)
  const entrevistasSparkline = dailySeries.map((d) => d.entrevistas)
  const reservasSparkline = dailySeries.map((d) => d.reservas)
  const ventasSparkline = dailySeries.map((d) => d.ventas)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Leads"
          value={targets.leads}
          conversionRate={conversions.contactadoRate}
          trend={trends.leads}
          sparklineData={leadsSparkline}
          gradientFrom="from-magenta-500"
          gradientTo="to-pink-500"
        />

        <MetricCard
          title="Contactados"
          value={targets.contactados}
          conversionRate={conversions.seguimientoRate}
          trend={trends.contactados}
          sparklineData={contactadosSparkline}
          gradientFrom="from-pink-500"
          gradientTo="to-rose-500"
        />

        <MetricCard
          title="En seguimiento"
          value={targets.seguimiento}
          conversionRate={conversions.entrevistaRate}
          trend={trends.seguimiento}
          sparklineData={seguimientoSparkline}
          gradientFrom="from-rose-500"
          gradientTo="to-orange-500"
        />

        <MetricCard
          title="Entrevistas"
          value={targets.entrevistas}
          conversionRate={conversions.reservaRate}
          trend={trends.entrevistas}
          sparklineData={entrevistasSparkline}
          gradientFrom="from-orange-500"
          gradientTo="to-yellow-500"
        />

        <MetricCard
          title="Reservas"
          value={targets.reservas}
          conversionRate={conversions.ventaRate}
          trend={trends.reservas}
          sparklineData={reservasSparkline}
          gradientFrom="from-yellow-500"
          gradientTo="to-cyan-500"
        />

        <MetricCard
          title="Ventas"
          value={targets.ventas}
          conversionRate={conversions.finalRate}
          trend={trends.ventas}
          sparklineData={ventasSparkline}
          gradientFrom="from-cyan-500"
          gradientTo="to-blue-500"
        />
      </div>
    </div>
  )
}
