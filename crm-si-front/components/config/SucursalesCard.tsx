"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2 } from "lucide-react"
import { SucursalesList } from "@/components/admin/SucursalesList"
import { useTranslation } from "@/hooks/useTranslation"
import { usePermission } from "@/hooks/usePermission"

export function SucursalesCard() {
  const { t } = useTranslation()
  const allowed = usePermission(["branches.view_any", "branches.view", "branches.manage"])

  if (!allowed) return null

  return (
    <Card className="rounded-2xl border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          {t("sucursales.title")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t("sucursales.subtitle")}</p>
      </CardHeader>
      <CardContent>
        <SucursalesList />
      </CardContent>
    </Card>
  )
}
