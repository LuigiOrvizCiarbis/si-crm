"use client"

import { useState } from "react"
import type { DateRange } from "react-day-picker"
import { SidebarLayout } from "@/components/sidebar-layout"
import { DashboardCompactHeader } from "@/components/dashboard-compact-header"
import { DashboardDateSelector } from "@/components/dashboard-date-selector"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MetricsCards } from "@/components/metrics-cards"
import { SalesFunnel } from "@/components/sales-funnel"
import { FunnelByChannelChart, TimeSeriesChart } from "@/components/dashboard-charts"
import { OmnichannelStats } from "@/components/omnichannel-stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAppStore } from "@/store/useAppStore"
import {
  Users,
  Target,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  MessageCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("general")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [datePreset, setDatePreset] = useState("este-mes")
  const leads = useAppStore((state) => state.leads)

  const totalLeads = leads.length
  const closedWon = leads.filter((l) => l.stage === "Cliente Convertido").length

  const handleDateChange = (range: DateRange | undefined, preset: string) => {
    setDateRange(range)
    setDatePreset(preset)
    console.log("[v0] Date range changed:", { range, preset })
  }

  // Mock data for tabs (would come from stores in real implementation)
  const taskStats = {
    overdue: 3,
    today: 8,
    thisWeek: 15,
    onTime: 87,
    critical: [
      { title: "Seguimiento con Cliente A", deadline: "Hoy", priority: "high" },
      { title: "Preparar propuesta B", deadline: "Mañana", priority: "medium" },
      { title: "Llamada de cierre C", deadline: "Jueves", priority: "medium" },
    ],
  }

  const sellerRanking = [
    { name: "Carlos Mendoza", leads: 45, sales: 8, conversion: 17.8, revenue: 28500 },
    { name: "Ana García", leads: 38, sales: 6, conversion: 15.8, revenue: 24200 },
    { name: "Luis Rodríguez", leads: 42, sales: 7, conversion: 16.7, revenue: 21800 },
    { name: "María López", leads: 35, sales: 5, conversion: 14.3, revenue: 19200 },
  ]

  const channelStats = [
    { channel: "WhatsApp", leads: 156, conversions: 34, rate: 21.8, revenue: 42500 },
    { channel: "Instagram", leads: 89, conversions: 12, rate: 13.5, revenue: 18900 },
    { channel: "Facebook", leads: 67, conversions: 8, rate: 11.9, revenue: 12300 },
    { channel: "LinkedIn", leads: 45, conversions: 9, rate: 20.0, revenue: 22100 },
    { channel: "Email", leads: 34, conversions: 4, rate: 11.8, revenue: 9800 },
  ]

  const financialData = {
    currentRevenue: 97750,
    targetRevenue: 120000,
    projectedRevenue: 112500,
    pipelineValue: 234500,
    avgTicket: 4250,
    wonDeals: 23,
    lostDeals: 8,
    monthlyTrend: [
      { month: "Ene", revenue: 78200 },
      { month: "Feb", revenue: 85400 },
      { month: "Mar", revenue: 91200 },
      { month: "Abr", revenue: 97750 },
    ],
  }

  const channelDistributionData = [
    { name: "WhatsApp", value: 156, color: "#25D366" },
    { name: "Instagram", value: 89, color: "#E4405F" },
    { name: "Facebook", value: 67, color: "#1877F2" },
    { name: "LinkedIn", value: 45, color: "#0A66C2" },
    { name: "Email", value: 34, color: "#EA4335" },
    { name: "Web", value: 28, color: "#9333EA" },
  ]

  const totalConversations = channelDistributionData.reduce((sum, item) => sum + item.value, 0)

  const channelMetrics = {
    conversations: { current: totalConversations, previous: 378, change: 12.2 },
    messages: { current: 2847, previous: 2531, change: 12.5 },
    newContacts: { current: 147, previous: 132, change: 11.4 },
  }

  return (
    <SidebarLayout>
      <DashboardCompactHeader />

      <div className="p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <TabsList className="grid grid-cols-5 w-full max-w-3xl">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="canales">Canales</TabsTrigger>
              <TabsTrigger value="vendedores">Vendedores</TabsTrigger>
              <TabsTrigger value="tareas">Tareas</TabsTrigger>
              <TabsTrigger value="finanzas">Finanzas</TabsTrigger>
            </TabsList>
            <DashboardDateSelector onDateChange={handleDateChange} />
          </div>

          {/* TAB 1: GENERAL */}
          <TabsContent value="general" className="space-y-6 mt-6">
            {/* A. KPIs del embudo */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">KPIs del Embudo</h2>
                <Badge variant="outline" className="text-xs">
                  Tiempo real
                </Badge>
              </div>
              <MetricsCards />
            </section>

            {/* B. Progreso y metas */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Progreso y Metas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Users className="h-5 w-5 text-blue-500" />
                      <Badge variant="secondary" className="text-xs">
                        +12%
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nuevos Clientes</p>
                      <p className="text-2xl font-bold">
                        23 <span className="text-sm text-muted-foreground">/ 30</span>
                      </p>
                    </div>
                    <Progress value={76.7} className="h-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Target className="h-5 w-5 text-purple-500" />
                      <Badge variant="secondary" className="text-xs">
                        +8%
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pipeline Value</p>
                      <p className="text-2xl font-bold">
                        $234k <span className="text-sm text-muted-foreground">/ $200k</span>
                      </p>
                    </div>
                    <Progress value={117} className="h-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Calendar className="h-5 w-5 text-orange-500" />
                      <Badge variant="outline" className="text-xs border-red-500 text-red-500">
                        +2.3d
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tiempo Promedio Cierre</p>
                      <p className="text-2xl font-bold">
                        21d <span className="text-sm text-muted-foreground">/ 18d</span>
                      </p>
                    </div>
                    <Progress value={85.4} className="h-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <Badge variant="secondary" className="text-xs">
                        +15%
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue Proyectado</p>
                      <p className="text-2xl font-bold">
                        $112k <span className="text-sm text-muted-foreground">/ $120k</span>
                      </p>
                    </div>
                    <Progress value={93.8} className="h-2" />
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* C. Pipeline visual */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Pipeline Visual</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SalesFunnel />
                <div className="space-y-6">
                  <FunnelByChannelChart />
                  <TimeSeriesChart />
                </div>
              </div>
            </section>
          </TabsContent>

          {/* TAB 2: CANALES */}
          <TabsContent value="canales" className="space-y-6 mt-6">
            <section>
              <h2 className="text-lg font-semibold mb-4">Métricas Generales de Canales</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-blue-500" />
                        <p className="text-sm font-medium text-muted-foreground">Cantidad de Conversaciones</p>
                      </div>
                      <Badge
                        variant={channelMetrics.conversations.change > 0 ? "default" : "destructive"}
                        className="gap-1"
                      >
                        {channelMetrics.conversations.change > 0 ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {Math.abs(channelMetrics.conversations.change)}%
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold">{channelMetrics.conversations.current}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      vs {channelMetrics.conversations.previous} período anterior
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-purple-500" />
                        <p className="text-sm font-medium text-muted-foreground">Cantidad de Mensajes</p>
                      </div>
                      <Badge variant={channelMetrics.messages.change > 0 ? "default" : "destructive"} className="gap-1">
                        {channelMetrics.messages.change > 0 ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {Math.abs(channelMetrics.messages.change)}%
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold">{channelMetrics.messages.current.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      vs {channelMetrics.messages.previous.toLocaleString()} período anterior
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-green-500" />
                        <p className="text-sm font-medium text-muted-foreground">Contactos Nuevos</p>
                      </div>
                      <Badge
                        variant={channelMetrics.newContacts.change > 0 ? "default" : "destructive"}
                        className="gap-1"
                      >
                        {channelMetrics.newContacts.change > 0 ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {Math.abs(channelMetrics.newContacts.change)}%
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold">{channelMetrics.newContacts.current}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      vs {channelMetrics.newContacts.previous} período anterior
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución por Canal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={channelDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {channelDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {channelDistributionData.map((channel) => (
                        <div key={channel.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }} />
                            <span>{channel.name}</span>
                          </div>
                          <span className="font-medium">{channel.value} leads</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="lg:col-span-2">
                  <OmnichannelStats />
                </div>
              </div>
            </section>

            {/* Performance por Canal */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Performance por Canal</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Leads y Conversiones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {channelStats.map((channel) => (
                        <div key={channel.channel} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{channel.channel}</span>
                            <div className="flex items-center gap-3 text-sm">
                              <Badge variant="secondary">{channel.leads} leads</Badge>
                              <Badge variant="outline">{channel.rate}%</Badge>
                            </div>
                          </div>
                          <Progress value={channel.rate * 4} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue por Canal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {channelStats.map((channel) => (
                        <div key={channel.channel} className="flex items-center justify-between">
                          <span className="font-medium">{channel.channel}</span>
                          <div className="text-right">
                            <p className="font-bold">${(channel.revenue / 1000).toFixed(1)}k</p>
                            <p className="text-xs text-muted-foreground">{channel.conversions} ventas</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">Mejor canal del mes: WhatsApp</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        156 leads | 21.8% conversión | $42.5k revenue
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          {/* TAB 3: VENDEDORES */}
          <TabsContent value="vendedores" className="space-y-6 mt-6">
            {/* A. KPIs por etapa del vendedor seleccionado o promedio */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">KPIs del Equipo</h2>
                <Badge variant="outline">Promedio general</Badge>
              </div>
              <MetricsCards />
            </section>

            {/* B. Ranking del equipo */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Ranking del Equipo</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {sellerRanking.map((seller, index) => (
                      <div key={seller.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
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
                              <p className="font-medium">{seller.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {seller.leads} leads • {seller.sales} ventas • ${(seller.revenue / 1000).toFixed(1)}k
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{seller.conversion}%</Badge>
                        </div>
                        <Progress value={seller.conversion * 5} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* C. Comparativa */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Análisis Comparativo</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <TrendingUp className="w-5 h-5" />
                      Top Performers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {sellerRanking.slice(0, 2).map((seller) => (
                        <div key={seller.name} className="p-3 bg-green-50 rounded-lg">
                          <p className="font-medium">{seller.name}</p>
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-muted-foreground">{seller.conversion}% conversión</span>
                            <span className="font-medium text-green-600">${(seller.revenue / 1000).toFixed(1)}k</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <TrendingDown className="w-5 h-5" />
                      Necesitan Apoyo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {sellerRanking.slice(-2).map((seller) => (
                        <div key={seller.name} className="p-3 bg-orange-50 rounded-lg">
                          <p className="font-medium">{seller.name}</p>
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-muted-foreground">{seller.conversion}% conversión</span>
                            <span className="font-medium text-orange-600">${(seller.revenue / 1000).toFixed(1)}k</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          {/* TAB 4: TAREAS */}
          <TabsContent value="tareas" className="space-y-6 mt-6">
            {/* Alertas y notificaciones */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Alertas y Notificaciones</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <p className="font-semibold text-red-900">Tareas Vencidas</p>
                    </div>
                    <p className="text-3xl font-bold text-red-600">{taskStats.overdue}</p>
                    <p className="text-xs text-red-700 mt-1">Requieren atención inmediata</p>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-orange-600" />
                      <p className="font-semibold text-orange-900">Para Hoy</p>
                    </div>
                    <p className="text-3xl font-bold text-orange-600">{taskStats.today}</p>
                    <p className="text-xs text-orange-700 mt-1">Tareas programadas</p>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      <p className="font-semibold text-blue-900">Esta Semana</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{taskStats.thisWeek}</p>
                    <p className="text-xs text-blue-700 mt-1">Planificadas</p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Indicadores SLA */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Indicadores SLA</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance de Entrega</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tareas a tiempo</span>
                      <Badge className="bg-green-500">{taskStats.onTime}%</Badge>
                    </div>
                    <Progress value={taskStats.onTime} className="h-3" />

                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Seguimientos completados</p>
                        <p className="text-2xl font-bold">92%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Respuesta promedio</p>
                        <p className="text-2xl font-bold">2.3h</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Carga de Trabajo Semanal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {["Lun", "Mar", "Mié", "Jue", "Vie"].map((day, idx) => {
                        const load = [12, 15, 18, 14, 10][idx]
                        return (
                          <div key={day} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{day}</span>
                              <span className="text-muted-foreground">{load} tareas</span>
                            </div>
                            <Progress value={load * 5} className="h-2" />
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                      Cuello de botella: Miércoles (18 tareas)
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Tareas críticas */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Tareas Críticas</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {taskStats.critical.map((task, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              task.priority === "high" ? "bg-red-500" : "bg-orange-500"
                            }`}
                          />
                          <span className="font-medium">{task.title}</span>
                        </div>
                        <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>{task.deadline}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          {/* TAB 5: FINANZAS */}
          <TabsContent value="finanzas" className="space-y-6 mt-6">
            {/* KPIs financieros */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Métricas Financieras</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <Badge variant="secondary" className="text-xs">
                        +12.3%
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue Este Mes</p>
                      <p className="text-2xl font-bold">${(financialData.currentRevenue / 1000).toFixed(1)}k</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Meta: ${(financialData.targetRevenue / 1000).toFixed(0)}k
                      </p>
                    </div>
                    <Progress
                      value={(financialData.currentRevenue / financialData.targetRevenue) * 100}
                      className="h-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Target className="h-5 w-5 text-purple-500" />
                      <Badge variant="secondary" className="text-xs">
                        +8.7%
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue Proyectado</p>
                      <p className="text-2xl font-bold">${(financialData.projectedRevenue / 1000).toFixed(1)}k</p>
                      <p className="text-xs text-muted-foreground">Basado en pipeline</p>
                    </div>
                    <Progress
                      value={(financialData.projectedRevenue / financialData.targetRevenue) * 100}
                      className="h-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <TrendingUp className="h-5 w-5 text-cyan-500" />
                      <Badge variant="outline" className="text-xs">
                        Pipeline
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pipeline Value</p>
                      <p className="text-2xl font-bold">${(financialData.pipelineValue / 1000).toFixed(0)}k</p>
                      <p className="text-xs text-muted-foreground">En oportunidades activas</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Users className="h-5 w-5 text-blue-500" />
                      <Badge variant="secondary" className="text-xs">
                        Promedio
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                      <p className="text-2xl font-bold">${(financialData.avgTicket / 1000).toFixed(1)}k</p>
                      <p className="text-xs text-muted-foreground">Por venta cerrada</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Ventas cerradas vs perdidas */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Performance de Cierre</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Tendencia Mensual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {financialData.monthlyTrend.map((month) => (
                        <div key={month.month} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{month.month}</span>
                            <span className="text-sm">${(month.revenue / 1000).toFixed(1)}k</span>
                          </div>
                          <Progress value={(month.revenue / financialData.targetRevenue) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Win/Loss Ratio</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Ventas cerradas</span>
                        <Badge className="bg-green-500">{financialData.wonDeals}</Badge>
                      </div>
                      <Progress
                        value={(financialData.wonDeals / (financialData.wonDeals + financialData.lostDeals)) * 100}
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Ventas perdidas</span>
                        <Badge variant="destructive">{financialData.lostDeals}</Badge>
                      </div>
                      <Progress
                        value={(financialData.lostDeals / (financialData.wonDeals + financialData.lostDeals)) * 100}
                        className="h-2"
                      />
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground">Win Rate</p>
                      <p className="text-3xl font-bold text-green-600">
                        {((financialData.wonDeals / (financialData.wonDeals + financialData.lostDeals)) * 100).toFixed(
                          1,
                        )}
                        %
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Board-ready insights */}
            <section>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    Resumen Ejecutivo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Revenue acumulado</p>
                      <p className="text-2xl font-bold">${(financialData.currentRevenue / 1000).toFixed(1)}k</p>
                      <p className="text-xs text-green-600">81.5% de la meta mensual</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Oportunidades en pipeline</p>
                      <p className="text-2xl font-bold">${(financialData.pipelineValue / 1000).toFixed(0)}k</p>
                      <p className="text-xs text-purple-600">Equivalente a 1.95x la meta</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Proyección de cierre</p>
                      <p className="text-2xl font-bold">${(financialData.projectedRevenue / 1000).toFixed(1)}k</p>
                      <p className="text-xs text-cyan-600">93.8% de probabilidad</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  )
}
