"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Users, Calendar } from "lucide-react"

export function ConversionAnalytics() {
  const channelPerformance = [
    { channel: "WhatsApp", leads: 156, conversions: 23, rate: 14.7, color: "bg-green-500" },
    { channel: "Instagram", leads: 134, conversions: 18, rate: 13.4, color: "bg-pink-500" },
    { channel: "Facebook", leads: 89, conversions: 12, rate: 13.5, color: "bg-blue-500" },
    { channel: "LinkedIn", leads: 67, conversions: 11, rate: 16.4, color: "bg-blue-700" },
    { channel: "Email", leads: 45, conversions: 8, rate: 17.8, color: "bg-gray-500" },
    { channel: "Web Form", leads: 78, conversions: 9, rate: 11.5, color: "bg-purple-500" },
  ]

  const timeAnalysis = [
    { period: "Lunes", conversions: 12, leads: 89, rate: 13.5 },
    { period: "Martes", conversions: 15, leads: 94, rate: 16.0 },
    { period: "Miércoles", conversions: 18, leads: 102, rate: 17.6 },
    { period: "Jueves", conversions: 21, leads: 98, rate: 21.4 },
    { period: "Viernes", conversions: 16, leads: 87, rate: 18.4 },
    { period: "Sábado", conversions: 8, leads: 56, rate: 14.3 },
    { period: "Domingo", conversions: 6, leads: 43, rate: 14.0 },
  ]

  const topPerformers = [
    { name: "Carlos Mendoza", conversions: 12, leads: 45, rate: 26.7 },
    { name: "Ana García", conversions: 10, leads: 42, rate: 23.8 },
    { name: "Luis Rodríguez", conversions: 8, leads: 38, rate: 21.1 },
    { name: "María López", conversions: 7, leads: 35, rate: 20.0 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Rendimiento por Canal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {channelPerformance.map((channel, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${channel.color}`}></div>
                      <span className="font-medium">{channel.channel}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">
                        {channel.conversions}/{channel.leads}
                      </span>
                      <Badge variant="outline">{channel.rate}%</Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${channel.color}`} style={{ width: `${channel.rate}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              Análisis por Día de la Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timeAnalysis.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="font-medium w-20">{day.period}</span>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{day.leads} leads</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{day.conversions} conversiones</span>
                    <Badge
                      variant="outline"
                      className={
                        day.rate > 18
                          ? "border-green-500 text-green-700"
                          : day.rate > 15
                            ? "border-yellow-500 text-yellow-700"
                            : "border-red-500 text-red-700"
                      }
                    >
                      {day.rate}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Top Performers del Equipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topPerformers.map((performer, index) => (
              <div key={index} className="p-4 rounded-lg border bg-card">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{performer.name}</h4>
                    <Badge className="bg-purple-500 text-white">#{index + 1}</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Conversiones:</span>
                      <span className="font-medium text-foreground">{performer.conversions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Leads:</span>
                      <span className="font-medium text-foreground">{performer.leads}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tasa:</span>
                      <span className="font-medium text-green-600">{performer.rate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
