import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SalesFunnel() {
  const funnelData = [
    { stage: "Capturados", value: 100, color: "bg-primary" },
    { stage: "Calificados", value: 65, color: "bg-muted-foreground" },
    { stage: "Demo", value: 35, color: "bg-muted-foreground" },
    { stage: "Cierre", value: 15, color: "bg-accent" },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Embudo de ventas</CardTitle>
        <span className="text-sm text-muted-foreground">Últimos 30 días</span>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {funnelData.map((stage, index) => (
            <div key={stage.stage} className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span>{stage.stage}</span>
                <span>{stage.value}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-6">
                <div className={`h-6 rounded-full ${stage.color}`} style={{ width: `${stage.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
