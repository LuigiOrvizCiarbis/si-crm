"use client"

import { useState } from "react"
import { SidebarLayout } from "@/components/sidebar-layout"
import { DashboardCompactHeader } from "@/components/dashboard-compact-header"
import { MetricsCards } from "@/components/metrics-cards"
import { FunnelByChannelChart, TimeSeriesChart } from "@/components/dashboard-charts"
import { OmnichannelStats } from "@/components/omnichannel-stats"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppStore } from "@/store/useAppStore"

type DashboardView = "general" | "canales" | "vendedores" | "tareas" | "finanzas"

export default function Dashboard() {
  const [activeView, setActiveView] = useState<DashboardView>("general")
  const leads = useAppStore((state) => state.leads)

  // Calculate KPIs from real data
  const totalLeads = leads.length
  const activeLeads = leads.filter((l) => l.stage !== "Cliente Convertido" && l.stage !== "Descartado").length
  const opportunities = leads.filter((l) =>
    ["Propuesta enviada", "Interesado", "Entrevistas", "Cierre"].includes(l.stage),
  ).length
  const closedWon = leads.filter((l) => l.stage === "Cliente Convertido").length
  const conversionRate = totalLeads > 0 ? ((closedWon / totalLeads) * 100).toFixed(1) : "0.0"
  const estimatedRevenue = closedWon * 15000 // Assuming avg ticket of $15k

  // Stage distribution for funnel
  const stageGroups = leads.reduce(
    (acc, lead) => {
      acc[lead.stage] = (acc[lead.stage] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Task stats (mock data - would come from task store in real implementation)
  const taskStats = {
    overdue: 3,
    today: 8,
    thisWeek: 15,
  }

  return (
    <SidebarLayout>
      <DashboardCompactHeader />

      <div className="p-4 md:p-6 space-y-6">
        {/* View Selector */}
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as DashboardView)} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="canales">Canales</TabsTrigger>
            <TabsTrigger value="vendedores">Vendedores</TabsTrigger>
            <TabsTrigger value="tareas">Tareas</TabsTrigger>
            <TabsTrigger value="finanzas">Finanzas</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* VISTA GENERAL */}
        {activeView === "general" && (
          <>
            {/* A) KPIs CLAVE */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Métricas clave</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground mb-2">Leads totales</p>
                    <p className="text-3xl font-bold">{totalLeads}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground mb-2">Leads activos</p>
                    <p className="text-3xl font-bold">{activeLeads}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground mb-2">Oportunidades</p>
                    <p className="text-3xl font-bold">{opportunities}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground mb-2">Ventas cerradas</p>
                    <p className="text-3xl font-bold text-green-500">{closedWon}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground mb-2">Conversión</p>
                    <p className="text-3xl font-bold">{conversionRate}%</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground mb-2">Ingresos estimados</p>
                    <p className="text-3xl font-bold">${(estimatedRevenue / 1000).toFixed(0)}k</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* B) EMBUDO VISUAL */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Embudo de ventas</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FunnelByChannelChart />
                <TimeSeriesChart />
              </div>
            </div>

            {/* C) PERFORMANCE OPERATIVA */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Performance operativa</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Canales */}
                <Card>
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-4">Canales</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">WhatsApp</span>
                        <Badge variant="secondary">{Math.floor(totalLeads * 0.4)} leads</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Instagram</span>
                        <Badge variant="secondary">{Math.floor(totalLeads * 0.25)} leads</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Email</span>
                        <Badge variant="secondary">{Math.floor(totalLeads * 0.2)} leads</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Web</span>
                        <Badge variant="secondary">{Math.floor(totalLeads * 0.15)} leads</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tareas */}
                <Card>
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-4">Tareas</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Vencidas</span>
                        <Badge variant="destructive">{taskStats.overdue}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Para hoy</span>
                        <Badge variant="default">{taskStats.today}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Esta semana</span>
                        <Badge variant="secondary">{taskStats.thisWeek}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Vendedores */}
                <Card>
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-4">Vendedores</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Carlos R.</span>
                        <div className="text-right">
                          <Badge variant="secondary" className="mr-1">
                            {Math.floor(totalLeads * 0.3)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{closedWon > 0 ? "4 ventas" : ""}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Ana M.</span>
                        <div className="text-right">
                          <Badge variant="secondary" className="mr-1">
                            {Math.floor(totalLeads * 0.25)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{closedWon > 0 ? "3 ventas" : ""}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Luis P.</span>
                        <div className="text-right">
                          <Badge variant="secondary" className="mr-1">
                            {Math.floor(totalLeads * 0.25)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{closedWon > 0 ? "3 ventas" : ""}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* VISTA CANALES */}
        {activeView === "canales" && (
          <>
            <div>
              <h2 className="text-lg font-semibold mb-4">Análisis por canales</h2>
              <OmnichannelStats />
            </div>
          </>
        )}

        {/* VISTA VENDEDORES */}
        {activeView === "vendedores" && (
          <>
            <div>
              <h2 className="text-lg font-semibold mb-4">Performance de vendedores</h2>
              <MetricsCards />
            </div>
          </>
        )}

        {/* VISTA TAREAS */}
        {activeView === "tareas" && (
          <>
            <div>
              <h2 className="text-lg font-semibold mb-4">Resumen de tareas</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-red-500 mb-2">Vencidas</h3>
                    <p className="text-4xl font-bold">{taskStats.overdue}</p>
                    <p className="text-sm text-muted-foreground mt-2">Requieren atención inmediata</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-blue-500 mb-2">Para hoy</h3>
                    <p className="text-4xl font-bold">{taskStats.today}</p>
                    <p className="text-sm text-muted-foreground mt-2">A completar en las próximas horas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-green-500 mb-2">Esta semana</h3>
                    <p className="text-4xl font-bold">{taskStats.thisWeek}</p>
                    <p className="text-sm text-muted-foreground mt-2">Planificadas para los próximos días</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* VISTA FINANZAS */}
        {activeView === "finanzas" && (
          <>
            <div>
              <h2 className="text-lg font-semibold mb-4">Métricas financieras</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground mb-2">Ingresos totales</p>
                    <p className="text-3xl font-bold text-green-500">${(estimatedRevenue / 1000).toFixed(0)}k</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground mb-2">Ticket promedio</p>
                    <p className="text-3xl font-bold">$15k</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground mb-2">Pipeline value</p>
                    <p className="text-3xl font-bold">${((opportunities * 15000) / 1000).toFixed(0)}k</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground mb-2">Tasa de cierre</p>
                    <p className="text-3xl font-bold">{conversionRate}%</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </SidebarLayout>
  )
}
