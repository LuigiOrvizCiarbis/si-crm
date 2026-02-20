"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useConfigStore, type PlanId } from "@/store/useConfigStore"
import { CreditCard, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/hooks/useTranslation"

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

export function BillingCard() {
  const { billing } = useConfigStore()
  const { t } = useTranslation()

  return (
    <Card className="rounded-2xl border-[#1e2533]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          {t("settings.billing")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current plan */}
        <div className="p-4 rounded-lg border border-[#1e2533] bg-white/5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">{t("settings.currentPlan")}</p>
            <Badge variant="default">{billing.actual}</Badge>
          </div>
          <p className="text-2xl font-bold">${billing.montoUSD} USD{t("settings.perMonth")}</p>
          <p className="text-sm text-muted-foreground">{t("settings.expiresOn")} {t(billing.vencimiento)}</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("settings.billingDesc")}
          </p>
          <Link href="/pricing">
            <Button className="w-full gap-2">
              {t("settings.viewPlans")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
