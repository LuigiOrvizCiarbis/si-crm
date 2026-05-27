"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Plus } from "lucide-react"
import { SucursalesList } from "@/components/admin/SucursalesList"
import { useTranslation } from "@/hooks/useTranslation"
import { usePermission } from "@/hooks/usePermission"

export function SucursalesCard() {
  const { t } = useTranslation()
  const allowed = usePermission(["branches.view_any", "branches.view", "branches.manage"])
  const canManage = usePermission("branches.manage")
  const [creating, setCreating] = useState(false)

  if (!allowed) return null

  return (
    <Card className="rounded-2xl border-border">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {t("sucursales.title")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{t("sucursales.subtitle")}</p>
          </div>
          {canManage && (
            <Button onClick={() => setCreating(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              {t("sucursales.create")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <SucursalesList creating={creating} onCreatingChange={setCreating} />
      </CardContent>
    </Card>
  )
}
