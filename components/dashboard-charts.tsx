"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboardStore } from "@/store/useDashboardStore"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const COLORS = {
  WhatsApp: "#25D366",
  Instagram: "#E4405F",
  Web: "#3B82F6",
  Facebook: "#1877F2",
  LinkedIn: "#0A66C2",
  Telegram: "#0088CC",
}

// Funnel stacked by channel
export function FunnelByChannelChart() {
  const { targets, channelDistribution } = useDashboardStore()

  // Create funnel data with channel breakdown
  const funnelData = [
    { stage: "Leads", value: targets.leads, fill: "#EC4899" },
    { stage: "Contactados", value: targets.contactados, fill: "#F472B6" },
    { stage: "Seguimiento", value: targets.seguimiento, fill: "#FB923C" },
    { stage: "Entrevistas", value: targets.entrevistas, fill: "#FBBF24" },
    { stage: "Reservas", value: targets.reservas, fill: "#22D3EE" },
    { stage: "Ventas", value: targets.ventas, fill: "#3B82F6" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Embudo de conversión</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={funnelData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis type="number" stroke="#888" />
            <YAxis type="category" dataKey="stage" stroke="#888" width={100} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
              cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Time series 30 days
export function TimeSeriesChart() {
  const { dailySeries } = useDashboardStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Evolución últimos 30 días</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailySeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="date"
              stroke="#888"
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getDate()}/${date.getMonth() + 1}`
              }}
            />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <Legend />
            <Line type="monotone" dataKey="leads" stroke="#EC4899" strokeWidth={2} dot={false} name="Leads" />
            <Line
              type="monotone"
              dataKey="contactados"
              stroke="#F472B6"
              strokeWidth={2}
              dot={false}
              name="Contactados"
            />
            <Line
              type="monotone"
              dataKey="seguimiento"
              stroke="#FB923C"
              strokeWidth={2}
              dot={false}
              name="Seguimiento"
            />
            <Line
              type="monotone"
              dataKey="entrevistas"
              stroke="#FBBF24"
              strokeWidth={2}
              dot={false}
              name="Entrevistas"
            />
            <Line type="monotone" dataKey="reservas" stroke="#22D3EE" strokeWidth={2} dot={false} name="Reservas" />
            <Line type="monotone" dataKey="ventas" stroke="#3B82F6" strokeWidth={2} dot={false} name="Ventas" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Top vendors chart
export function TopVendorsChart() {
  const { vendorStats } = useDashboardStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top vendedores</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={vendorStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
              formatter={(value: number, name: string) => {
                if (name === "conversion") return [`${value.toFixed(1)}%`, "Conversión"]
                return [value, name === "ventas" ? "Ventas" : "Leads"]
              }}
            />
            <Legend />
            <Bar dataKey="ventas" fill="#3B82F6" name="Ventas" radius={[4, 4, 0, 0]} />
            <Bar dataKey="conversion" fill="#22D3EE" name="Conversión (%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Channel distribution pie chart
export function ChannelDistributionChart() {
  const { channelDistribution } = useDashboardStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Distribución por canal</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={channelDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ channel, percentage }) => `${channel} ${percentage.toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
            >
              {channelDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.channel as keyof typeof COLORS] || "#888"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
              formatter={(value: number, name: string, props: any) => [
                `${value} leads (${props.payload.percentage.toFixed(1)}%)`,
                props.payload.channel,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
