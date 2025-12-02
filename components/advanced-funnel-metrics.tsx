"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Target, Clock, DollarSign } from "lucide-react"

export function AdvancedFunnelMetrics() {
  const funnelStages = [
    {
      stage: "Visitantes",
      current: 2847,
      previous: 2654,
      conversion: 100,
      avgTime: "2.3 min",
      color: "bg-blue-500",
    },
    {
      stage: "Leads Capturados",
      current: 456,
      previous: 423,
      conversion: 16.0,
      avgTime: "1.2 días",
      color: "bg-green-500",
    },
    {
      stage: "Calificados",
      current: 234,
      previous: 198,
      conversion: 51.3,
      avgTime: "3.5 días",
      color: "bg-yellow-500",
    },
    {
      stage: "Demo Agendada",
      current: 89,
      previous: 76,
      conversion: 38.0,
      avgTime: "2.1 días",
      color: "bg-orange-500",
    },
    {
      stage: "Propuesta Enviada",
      current: 67,
      previous: 58,
      conversion: 75.3,
      avgTime: "4.2 días",
      color: "bg-purple-500",
    },
    {
      stage: "Cerrado Ganado",
      current: 23,
      previous: 19,
      conversion: 34.3,
      avgTime: "7.8 días",
      color: "bg-red-500",
    },
  ]

  const getChangePercentage = (current: number, previous: number) => {
    return (((current - previous) / previous) * 100).toFixed(1)
  }

  const getChangeIcon = (current: number, previous: number) => {
    return current > previous ? TrendingUp : TrendingDown
  }

  const getChangeColor = (current: number, previous: number) => {
    return current > previous ? "text-green-500" : "text-red-500"
  }

  return (
    <div className="space-y-6">
      {/* Funnel Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Análisis Detallado del Embudo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelStages.map((stage, index) => {
              const changePercent = getChangePercentage(stage.current, stage.previous)
              const ChangeIcon = getChangeIcon(stage.current, stage.previous)
              const changeColor = getChangeColor(stage.current, stage.previous)

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                      <span className="font-medium">{stage.stage}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{stage.avgTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ChangeIcon className={`h-4 w-4 ${changeColor}`} />
                        <span className={changeColor}>{changePercent}%</span>
                      </div>
                      <Badge variant="outline">{stage.current.toLocaleString()}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Progress value={stage.conversion} className="h-2" />
                    </div>
                    <span className="text-sm font-medium w-12">{stage.conversion}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversión Global</p>
                <p className="text-2xl font-bold">0.81%</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +0.12% vs mes anterior
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tiempo Promedio</p>
                <p className="text-2xl font-bold">21.1 días</p>
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  +2.3 días vs mes anterior
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Promedio</p>
                <p className="text-2xl font-bold">$4,250</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +$320 vs mes anterior
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
