import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: "lead",
      title: "Nuevo lead desde Meta Ads",
      subtitle: "Campaña Verano 2025",
      time: "2h",
      emoji: "🎯",
    },
    {
      id: 2,
      type: "bot",
      title: "Bot calificó lead:",
      subtitle: "Score 72 → etapa 'Calificado'",
      time: "4h",
      emoji: "🤖",
    },
    {
      id: 3,
      type: "demo",
      title: "Demo agendada vía Google Calendar",
      subtitle: "Reunión con cliente potencial",
      time: "6h",
      emoji: "📅",
    },
    {
      id: 4,
      type: "message",
      title: "Mensaje enviado por WhatsApp",
      subtitle: "Seguimiento automático",
      time: "8h",
      emoji: "💬",
    },
    {
      id: 5,
      type: "sale",
      title: "Venta cerrada exitosamente",
      subtitle: "$2,500 USD - Plan Premium",
      time: "1d",
      emoji: "💰",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad reciente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm">{activity.emoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{activity.title}</p>
              {activity.subtitle && <p className="text-xs text-muted-foreground">{activity.subtitle}</p>}
            </div>
            <span className="text-xs text-muted-foreground">{activity.time}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
