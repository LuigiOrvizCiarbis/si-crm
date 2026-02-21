"use client"

import { useEffect, useState } from "react"
import { getAuthToken } from "@/lib/api/auth-token"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, UserPlus, TrendingUp, Loader2 } from "lucide-react"

export function ContactsStats() {
  const [stats, setStats] = useState({
    total: 0,
    withConversations: 0,
    recentContacts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/contacts?per_page=1000', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const result = await response.json()
        const contacts = result.data || []
        
        const total = result.meta?.total || contacts.length
        const withConversations = contacts.filter((c: any) => 
          c.conversations && c.conversations.length > 0
        ).length
        
        // Contactos creados en los últimos 7 días
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const recentContacts = contacts.filter((c: any) => 
          new Date(c.created_at) > weekAgo
        ).length

        setStats({
          total,
          withConversations,
          recentContacts,
        })
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const statsData = [
    {
      title: "Total Contactos",
      value: loading ? "..." : stats.total.toString(),
      icon: Users,
    },
    {
      title: "Con Conversaciones",
      value: loading ? "..." : stats.withConversations.toString(),
      icon: UserCheck,
    },
    {
      title: "Nuevos (7 días)",
      value: loading ? "..." : stats.recentContacts.toString(),
      icon: UserPlus,
    },
    {
      title: "Tasa Actividad",
      value: loading ? "..." : stats.total > 0 ? `${Math.round((stats.withConversations / stats.total) * 100)}%` : "0%",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              {loading ? (
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
              ) : (
                <Icon className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
