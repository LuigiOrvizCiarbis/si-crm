import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getStageStats } from "@/lib/data"

export function SalesFunnel() {
  const stats = getStageStats()

  const funnelData = [
    {
      stage: "Lead/Prospecto",
      value: stats.prospecto.count,
      total:
        stats.prospecto.count +
        stats.contactado.count +
        stats.seguimiento.count +
        stats.propuesta.count +
        stats.interesado.count +
        stats.recontactar.count +
        stats["entrevista-pactada"].count +
        stats["entrevista-realizada"].count +
        stats.reagendar.count +
        stats["segunda-entrevista"].count +
        stats.cierre.count,
      color: "bg-blue-500",
    },
    {
      stage: "Contactado",
      value: stats.contactado.count,
      total:
        stats.contactado.count +
        stats.seguimiento.count +
        stats.propuesta.count +
        stats.interesado.count +
        stats.recontactar.count +
        stats["entrevista-pactada"].count +
        stats["entrevista-realizada"].count +
        stats.reagendar.count +
        stats["segunda-entrevista"].count +
        stats.cierre.count,
      color: "bg-cyan-500",
    },
    {
      stage: "En seguimiento",
      value: stats.seguimiento.count,
      total:
        stats.seguimiento.count +
        stats.propuesta.count +
        stats.interesado.count +
        stats["entrevista-pactada"].count +
        stats["entrevista-realizada"].count +
        stats["segunda-entrevista"].count +
        stats.cierre.count,
      color: "bg-indigo-500",
    },
    {
      stage: "Propuesta enviada",
      value: stats.propuesta.count,
      total:
        stats.propuesta.count +
        stats.interesado.count +
        stats["entrevista-pactada"].count +
        stats["entrevista-realizada"].count +
        stats["segunda-entrevista"].count +
        stats.cierre.count,
      color: "bg-purple-500",
    },
    {
      stage: "Interesado",
      value: stats.interesado.count,
      total:
        stats.interesado.count +
        stats["entrevista-pactada"].count +
        stats["entrevista-realizada"].count +
        stats["segunda-entrevista"].count +
        stats.cierre.count,
      color: "bg-pink-500",
    },
    {
      stage: "Entrevistas",
      value:
        stats["entrevista-pactada"].count + stats["entrevista-realizada"].count + stats["segunda-entrevista"].count,
      total:
        stats["entrevista-pactada"].count +
        stats["entrevista-realizada"].count +
        stats["segunda-entrevista"].count +
        stats.cierre.count,
      color: "bg-emerald-500",
    },
    {
      stage: "Cierre",
      value: stats.cierre.count,
      total: stats.cierre.count,
      color: "bg-green-500",
    },
    {
      stage: "Convertido",
      value: stats.convertido.count,
      total: stats.convertido.count,
      color: "bg-green-600",
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Embudo de ventas</CardTitle>
        <span className="text-sm text-muted-foreground">Tiempo real</span>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {funnelData.map((stage) => {
            const percentage = stage.total > 0 ? Math.round((stage.value / stage.total) * 100) : 0

            return (
              <div key={stage.stage} className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span>{stage.stage}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground">{stage.value} leads</span>
                    <span>{percentage}%</span>
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-6 relative overflow-hidden">
                  <div
                    className={`h-6 rounded-full ${stage.color} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-border grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{stats.convertido.count}</p>
            <p className="text-xs text-muted-foreground">Clientes ganados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{stats["no-interesa"].count}</p>
            <p className="text-xs text-muted-foreground">No interesados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{stats.partner.count}</p>
            <p className="text-xs text-muted-foreground">Partners/Colegas</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
