"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Loader2 } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import { useIsOwner, usePermission } from "@/hooks/usePermission"
import { useBranchesStore } from "@/store/useBranchesStore"
import { useAppStore } from "@/store/useAppStore"
import { BranchStats, getBranchesDashboard } from "@/lib/api/branches"

export function BranchComparisonSection() {
  const { t } = useTranslation()
  const isOwner = useIsOwner()
  const canViewAll = usePermission("branches.view_all")
  const { branches, loaded, fetch } = useBranchesStore()
  const { filters } = useAppStore()
  const [stats, setStats] = useState<BranchStats[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!loaded) fetch()
  }, [loaded, fetch])

  useEffect(() => {
    if (!isOwner && !canViewAll) return
    if (loaded && branches.length === 0) return

    let cancelled = false
    setLoading(true)
    getBranchesDashboard(filters.rango).then(({ data }) => {
      if (cancelled) return
      setStats(data)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [filters.rango, isOwner, canViewAll, branches.length, loaded])

  if (!isOwner && !canViewAll) return null
  if (loaded && branches.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          {t("sucursales.dashboard.title")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t("sucursales.dashboard.subtitle")}</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-2 px-3">{t("sucursales.fields.name")}</th>
                  <th className="py-2 px-3 text-right">{t("sucursales.dashboard.contacts")}</th>
                  <th className="py-2 px-3 text-right">{t("sucursales.dashboard.conversations")}</th>
                  <th className="py-2 px-3 text-right">{t("sucursales.dashboard.opportunities")}</th>
                  <th className="py-2 px-3 text-right">{t("sucursales.dashboard.value")}</th>
                  <th className="py-2 px-3 text-right">{t("sucursales.dashboard.won")}</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-2 px-3 font-medium">{row.name}</td>
                    <td className="py-2 px-3 text-right">{row.contacts_total}</td>
                    <td className="py-2 px-3 text-right">{row.conversations_open}</td>
                    <td className="py-2 px-3 text-right">{row.opportunities_count}</td>
                    <td className="py-2 px-3 text-right">
                      {row.opportunities_value.toLocaleString(undefined, {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="py-2 px-3 text-right">{row.opportunities_won}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
