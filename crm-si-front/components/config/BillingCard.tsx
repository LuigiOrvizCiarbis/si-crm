"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useConfigStore, type PlanId } from "@/store/useConfigStore"
import { CreditCard, ArrowRight } from "lucide-react"
import Link from "next/link"

const plans = [
  { id: "starter" as PlanId, nombre: "Starter", precio: 50, recommended: false, bestselling: false },
  { id: "classic" as PlanId, nombre: "Classic", precio: 100, recommended: false, bestselling: false },
  { id: "intermediate" as PlanId, nombre: "Intermediate", precio: 250, recommended: true, bestselling: false },
  { id: "high" as PlanId, nombre: "High", precio: 500, recommended: false, bestselling: true },
  {
    id: "enterprise" as PlanId,
    nombre: "Custom Enterprise",
    precio: 0,
    recommended: false,
    bestselling: false,
    custom: true,
  },
  {
    id: "agency" as PlanId,
    nombre: "Agency White Label",
    precio: 0,
    recommended: false,
    bestselling: false,
    custom: true,
  },
]

const groupedFeatures = [
  {
    category: "Métricas",
    rows: [
      { name: "Métricas básicas", values: ["✓", ".", ".", ".", ".", "."] },
      { name: "Métricas completas", values: ["—", "✓", "✓", "✓", "✓", "✓"] },
    ],
  },
  {
    category: "Usuarios",
    rows: [
      { name: "Cantidad de usuarios", values: ["1", "1", "3", "10", "Ilimitados", "Custom"] },
      { name: "+ Usuario extra", values: ["—", "$100", "$75", "$50", ".", "Custom"], isNote: true },
    ],
  },
  {
    category: "Conversaciones",
    rows: [
      {
        name: "Conversaciones nuevas al mes",
        values: ["3.000", "3.000", "5.000", "15.000", "Ilimitadas", "3.000 por sub-cliente"],
      },
      { name: "+ 1000 conversaciones extra", values: ["—", "$100", "$100", "$100", ".", "."], isNote: true },
    ],
  },
  {
    category: "Funcionalidades",
    rows: [
      { name: "Embudo/Pipeline", values: ["✓", "✓", "✓", "✓", "✓", "✓"] },
      { name: "Base de datos", values: ["✓", "✓", "✓", "✓", "✓", "✓"] },
      { name: "Tareas", values: ["—", "✓", "✓", "✓", "✓", "✓"] },
      { name: "Roles y permisos", values: ["—", "—", "✓", "✓", "✓", "✓"] },
      { name: "ChatBot IA", values: ["—", "—", "✓", "✓", "✓", "Custom"] },
      { name: "IA avanzada", values: ["—", "—", "—", "✓", "✓", "Custom"] },
      { name: "Plan re-marketing con IA", values: ["—", "—", "—", "✓", "✓", "Custom"] },
      { name: "Marca Blanca", values: ["—", "—", "—", "—", "Custom", "✓"] },
      { name: "Módulos a medida", values: ["—", "—", "—", "—", "Custom", "Custom"] },
      { name: "Soporte prioritario", values: ["—", "—", "—", "—", "✓", "✓"] },
      { name: "Look&Feel Personalizado", values: ["—", "—", "—", "—", "✓", "✓"] },
    ],
  },
  {
    category: "Sub-clientes",
    rows: [
      { name: "Cantidad de sub-clientes", values: ["—", "—", "—", "—", "—", "Custom"] },
      { name: "Usuarios por sub-cliente", values: ["—", "—", "—", "—", "—", "Custom"] },
    ],
  },
]

const channels = [
  "WhatsApp",
  "Telegram",
  "Instagram",
  "Facebook Messenger",
  "LinkedIn",
  "TikTok",
  "Gmail",
  "Outlook (hotmail)",
  "Mail corporativo (web mail)",
  "Formulario Web",
  "Chat flotante Web",
]

export function BillingCard() {
  const { billing } = useConfigStore()

  return (
    <Card className="rounded-2xl border-[#1e2533]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Facturación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan actual */}
        <div className="p-4 rounded-lg border border-[#1e2533] bg-white/5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Plan actual</p>
            <Badge variant="default">{billing.actual}</Badge>
          </div>
          <p className="text-2xl font-bold">${billing.montoUSD} USD/mes</p>
          <p className="text-sm text-muted-foreground">Vence el {billing.vencimiento}</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Gestiona tu suscripción, compara planes y actualiza tu facturación.
          </p>
          <Link href="/pricing">
            <Button className="w-full gap-2">
              Ver planes y pagar
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
