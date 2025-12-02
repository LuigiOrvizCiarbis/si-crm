"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, UserPlus, TrendingUp } from "lucide-react"

export function ContactsStats() {
  const stats = [
    {
      title: "Total Contactos",
      value: "1,247",
      change: "+12%",
      changeType: "positive" as const,
      icon: Users,
    },
    {
      title: "Leads Activos",
      value: "342",
      change: "+8%",
      changeType: "positive" as const,
      icon: UserPlus,
    },
    {
      title: "Calificados",
      value: "156",
      change: "+15%",
      changeType: "positive" as const,
      icon: UserCheck,
    },
    {
      title: "Tasa Conversión",
      value: "24.5%",
      change: "+3.2%",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.changeType === "positive" ? "text-green-600" : "text-red-600"}>
                  {stat.change}
                </span>{" "}
                desde el mes pasado
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
