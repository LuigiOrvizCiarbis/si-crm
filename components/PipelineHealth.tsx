"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Clock, XCircle, CheckCircle2 } from "lucide-react"

interface SLAIndicatorProps {
  label: string
  percentage: number
}

function SLAIndicator({ label, percentage }: SLAIndicatorProps) {
  const getColor = () => {
    if (percentage >= 80) return "text-green-500 border-green-500/30 bg-green-500/10"
    if (percentage >= 60) return "text-yellow-500 border-yellow-500/30 bg-yellow-500/10"
    return "text-red-500 border-red-500/30 bg-red-500/10"
  }

  const getIcon = () => {
    if (percentage >= 80) return <CheckCircle2 className="w-4 h-4" />
    if (percentage >= 60) return <AlertCircle className="w-4 h-4" />
    return <XCircle className="w-4 h-4" />
  }

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${getColor()}`}>
      <div className="flex items-center gap-3">
        {getIcon()}
        <span className="font-medium">{label}</span>
      </div>
      <span className="text-2xl font-bold tabular-nums">{percentage}%</span>
    </div>
  )
}

export function PipelineHealth() {
  // Mock SLA data (in real app, calculate from tasks/interviews)
  const slaMetrics = [
    { label: "Tareas a tiempo", percentage: 85 },
    { label: "Entrevistas programadas", percentage: 72 },
    { label: "Seguimientos completados", percentage: 58 },
  ]

  // Mock overdue data
  const overdueByStage = [
    { stage: "Contactados", count: 12 },
    { stage: "En seguimiento", count: 8 },
    { stage: "Entrevistas", count: 5 },
    { stage: "Reservas", count: 3 },
  ]

  // Mock loss reasons
  const lossReasons = [
    { reason: "Precio alto", count: 15 },
    { reason: "No responde", count: 12 },
    { reason: "Eligió competidor", count: 8 },
    { reason: "No es el momento", count: 6 },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* SLA Semáforos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-500" />
            Indicadores SLA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {slaMetrics.map((metric) => (
            <SLAIndicator key={metric.label} {...metric} />
          ))}
        </CardContent>
      </Card>

      {/* Atrasos por etapa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Pendientes vencidos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {overdueByStage.map((item) => (
            <div
              key={item.stage}
              className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50"
            >
              <span className="text-sm text-muted-foreground">{item.stage}</span>
              <Badge variant="destructive" className="tabular-nums">
                {item.count} vencidos
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pérdidas y razones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Razones de pérdida
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lossReasons.map((item) => (
            <div
              key={item.reason}
              className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50"
            >
              <span className="text-sm">{item.reason}</span>
              <Badge variant="outline" className="tabular-nums">
                {item.count}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
