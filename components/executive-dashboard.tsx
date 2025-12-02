"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, DollarSign, Target, Users, Calendar, Award, AlertTriangle } from "lucide-react"

export function ExecutiveDashboard() {
  const kpis = [
    {
      title: "Revenue Este Mes",
      value: "$97,750",
      target: "$120,000",
      progress: 81.5,
      change: "+12.3%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      title: "Nuevos Clientes",
      value: "23",
      target: "30",
      progress: 76.7,
      change: "+21.1%",
      trend: "up",
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Pipeline Value",
      value: "$234,500",
      target: "$200,000",
      progress: 117.3,
      change: "+8.7%",
      trend: "up",
      icon: Target,
      color: "text-purple-500",
    },
    {
      title: "Tiempo Promedio Cierre",
      value: "21.1 días",
      target: "18 días",
      progress: 85.4,
      change: "+2.3 días",
      trend: "down",
      icon: Calendar,
      color: "text-orange-500",
    },
  ]

  const alerts = [
    {
      type: "warning",
      title: "Pipeline Estancado",
      description: "12 oportunidades llevan más de 30 días sin actividad",
      action: "Revisar oportunidades",
    },
    {
      type: "success",
      title: "Meta Mensual",
      description: "Estás a solo $22,250 de alcanzar la meta de revenue",
      action: "Ver pipeline",
    },
    {
      type: "info",
      title: "Nuevos Leads",
      description: "47 nuevos leads capturados hoy, 23 requieren calificación",
      action: "Calificar leads",
    },
  ]

  const teamPerformance = [
    { name: "Carlos Mendoza", revenue: 28500, deals: 8, target: 30000, performance: 95.0 },
    { name: "Ana García", revenue: 24200, deals: 6, target: 25000, performance: 96.8 },
    { name: "Luis Rodríguez", revenue: 21800, deals: 5, target: 22000, performance: 99.1 },
    { name: "María López", revenue: 19200, deals: 4, target: 20000, performance: 96.0 },
  ]

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return AlertTriangle
      case "success":
        return Award
      default:
        return Target
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "warning":
        return "border-yellow-500 bg-yellow-50"
      case "success":
        return "border-green-500 bg-green-50"
      default:
        return "border-blue-500 bg-blue-50"
    }
  }

  return (
    <div className="space-y-6">
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  <div
                    className={`flex items-center gap-1 text-xs ${
                      kpi.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {kpi.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {kpi.change}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">Meta: {kpi.target}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progreso</span>
                    <span className="font-medium">{kpi.progress}%</span>
                  </div>
                  <Progress value={kpi.progress} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alertas y Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => {
                const AlertIcon = getAlertIcon(alert.type)
                return (
                  <div key={index} className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}>
                    <div className="flex items-start gap-3">
                      <AlertIcon className="h-5 w-5 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <p className="text-xs text-muted-foreground">{alert.description}</p>
                        <button className="text-xs text-blue-600 hover:underline">{alert.action}</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              Rendimiento del Equipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamPerformance.map((member, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ${member.revenue.toLocaleString()} • {member.deals} deals
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        member.performance >= 95
                          ? "border-green-500 text-green-700"
                          : member.performance >= 90
                            ? "border-yellow-500 text-yellow-700"
                            : "border-red-500 text-red-700"
                      }
                    >
                      {member.performance}%
                    </Badge>
                  </div>
                  <Progress value={member.performance} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
