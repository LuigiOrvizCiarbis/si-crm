"use client"

import { SidebarLayout } from "@/components/sidebar-layout"
import { DashboardCompactHeader } from "@/components/dashboard-compact-header"
import { MetricsCards } from "@/components/metrics-cards"
import { SalesFunnel } from "@/components/sales-funnel"
import { FunnelByChannelChart, TimeSeriesChart } from "@/components/dashboard-charts"
import { OmnichannelStats } from "@/components/omnichannel-stats"
import { ExecutiveDashboard } from "@/components/executive-dashboard"
import { PipelineHealth } from "@/components/PipelineHealth"
import { RecentActivity } from "@/components/recent-activity"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAppStore } from "@/store/useAppStore"
import { Users, Target, CheckCircle2, Calendar } from "lucide-react"

export default function Dashboard() {
  const leads = useAppStore((state) => state.leads)

  // Calculate real data from store
  const totalLeads = leads.length
  const closedWon = leads.filter((l) => l.stage === "Cliente Convertido").length

  // Mock task data (would come from task store in real implementation)
  const taskStats = {
    overdue: 3,
    today: 8,
    thisWeek: 15,
    onTime: 87,
  }

  // Mock seller data
  const sellerRanking = [
    { name: "Carlos Mendoza", leads: 45, sales: 8, conversion: 17.8 },
    { name: "Ana García", leads: 38, sales: 6, conversion: 15.8 },
    { name: "Luis Rodríguez", leads: 42, sales: 7, conversion: 16.7 },
    { name: "María López", leads: 35, sales: 5, conversion: 14.3 },
  ]

  // Mock weekday analysis
  const weekdayData = [
    { day: "Lun", leads: 18, conversions: 3 },
    { day: "Mar", leads: 22, conversions: 4 },
    { day: "Mié", leads: 20, conversions: 5 },
    { day: "Jue", leads: 24, conversions: 6 },
    { day: "Vie", leads: 19, conversions: 2 },
  ]

  return (
    <SidebarLayout>
      <DashboardCompactHeader />

      <div className="p-4 md:p-6 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">KPI Core del Negocio</h2>
            <Badge variant="outline" className="text-xs">
              Tiempo real
            </Badge>
          </div>
          <MetricsCards />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Embudo y Tendencia</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalesFunnel />
            <div className="space-y-6">
              <FunnelByChannelChart />
              <TimeSeriesChart />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Performance Operativa</h2>

          {/* Subbloque: Canales */}
          <div className="mb-6">
            <h3 className="text-base font-medium mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-500" />
              Distribución por Canales
            </h3>
            <OmnichannelStats />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subbloque: Tareas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  Gestión de Tareas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Vencidas</p>
                    <p className="text-3xl font-bold text-red-500">{taskStats.overdue}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Para hoy</p>
                    <p className="text-3xl font-bold text-blue-500">{taskStats.today}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Esta semana</p>
                    <p className="text-3xl font-bold text-cyan-500">{taskStats.thisWeek}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">% a tiempo</p>
                    <p className="text-3xl font-bold text-green-500">{taskStats.onTime}%</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Próximas tareas críticas</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Seguimiento con Cliente A</span>
                      <Badge variant="destructive" className="text-xs">
                        Hoy
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Preparar propuesta B</span>
                      <Badge variant="secondary" className="text-xs">
                        Mañana
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Llamada de cierre C</span>
                      <Badge variant="secondary" className="text-xs">
                        Jueves
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subbloque: Vendedores */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  Ranking de Vendedores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sellerRanking.map((seller, index) => (
                    <div key={seller.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0
                                ? "bg-yellow-100 text-yellow-700"
                                : index === 1
                                  ? "bg-gray-100 text-gray-700"
                                  : index === 2
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{seller.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {seller.leads} leads • {seller.sales} ventas
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {seller.conversion}%
                        </Badge>
                      </div>
                      <Progress value={seller.conversion * 5} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Performance Comercial Avanzada</h2>
          <ExecutiveDashboard />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Salud del Pipeline</h2>
          <PipelineHealth />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Actividad y Análisis Temporal</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivity />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-500" />
                  Análisis por Día de la Semana
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weekdayData.map((day) => (
                    <div key={day.day} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{day.day}</span>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-muted-foreground">{day.leads} leads</span>
                          <Badge variant="secondary">{day.conversions} conv</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-2 bg-cyan-100 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500" style={{ width: `${(day.leads / 24) * 100}%` }} />
                        </div>
                        <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: `${(day.conversions / 6) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                  <p>Mejor día: Jueves (24 leads, 6 conversiones)</p>
                  <p>Día más bajo: Viernes (19 leads, 2 conversiones)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </SidebarLayout>
  )
}
