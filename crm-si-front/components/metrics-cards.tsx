import { Card, CardContent } from "@/components/ui/card"

interface MetricCardProps {
  title: string
  value: string | number
  className?: string
}

function MetricCard({ title, value, className }: MetricCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

export function MetricsCards() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Cantidad de mensajes" value="2056" />
        <MetricCard title="Cantidad de conversaciones" value="289" />
        <MetricCard title="Contactos nuevos" value="190" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Leads capturados" value="264" />
        <MetricCard title="Oportunidades activas" value="86" />
        <MetricCard title="Conversión global" value="12.7%" />
        <MetricCard title="ROI por canal" value="+3.1x" className="text-green-500" />
      </div>
    </div>
  )
}
