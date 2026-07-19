"use client"

import { useCallback, useEffect, useState } from "react"
import { BadgeCheck, ExternalLink, RefreshCw, ShieldCheck } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChannelType } from "@/data/enums"
import type { Channel } from "@/data/types"
import {
  getBusinessVerification,
  getChannels,
  type BusinessVerification,
  type BusinessVerificationStatus,
} from "@/lib/api/channels"
import { useIsAdmin } from "@/hooks/usePermission"
import { useTranslation } from "@/hooks/useTranslation"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

// Estados que se muestran como badge verde/amarillo/rojo/gris.
const STATUS_VARIANT: Record<BusinessVerificationStatus, BadgeVariant> = {
  verified: "default",
  pending: "secondary",
  not_verified: "outline",
  failed: "destructive",
  business_id_missing: "outline",
  permission_missing: "destructive",
  token_invalid: "destructive",
  unknown: "outline",
}

interface Row {
  channel: Channel
  loading: boolean
  data?: BusinessVerification
  error?: boolean
}

export function BusinessVerificationCard() {
  const { t } = useTranslation()
  const isAdmin = useIsAdmin()
  const [rows, setRows] = useState<Row[]>([])
  const [loadingChannels, setLoadingChannels] = useState(true)

  const load = useCallback(async () => {
    setLoadingChannels(true)
    try {
      const channels = await getChannels()
      const whatsappChannels = channels.filter(
        (c) => c.type === ChannelType.WHATSAPP,
      )

      setRows(whatsappChannels.map((channel) => ({ channel, loading: true })))
      setLoadingChannels(false)

      // Consultar el estado de cada canal en paralelo.
      await Promise.all(
        whatsappChannels.map(async (channel) => {
          try {
            const data = await getBusinessVerification(channel.id)
            setRows((prev) =>
              prev.map((r) =>
                r.channel.id === channel.id ? { ...r, loading: false, data } : r,
              ),
            )
          } catch {
            setRows((prev) =>
              prev.map((r) =>
                r.channel.id === channel.id
                  ? { ...r, loading: false, error: true }
                  : r,
              ),
            )
          }
        }),
      )
    } catch {
      setRows([])
      setLoadingChannels(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) void load()
  }, [isAdmin, load])

  // Sólo admins gestionan la verificación (mismo criterio que conectar canales).
  if (!isAdmin) return null

  return (
    <Card className="rounded-2xl border-border">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              {t("businessVerification.title")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("businessVerification.subtitle")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void load()}
            disabled={loadingChannels}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            {t("businessVerification.refresh")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loadingChannels ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("businessVerification.empty")}
          </p>
        ) : (
          rows.map((row) => (
            <VerificationRow key={row.channel.id} row={row} />
          ))
        )}
      </CardContent>
    </Card>
  )
}

function VerificationRow({ row }: { row: Row }) {
  const { t } = useTranslation()
  const { channel, loading, data, error } = row

  const phone =
    channel.whatsapp_config?.display_phone_number ??
    channel.whatsapp_config?.phone_number_id ??
    ""

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-sm font-medium text-foreground">
          {data?.business_name || channel.name}
        </p>
        {phone && (
          <p className="truncate text-xs text-muted-foreground">{phone}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {loading ? (
          <Skeleton className="h-6 w-24 rounded-full" />
        ) : error ? (
          <Badge variant="destructive">
            {t("businessVerification.status.unknown")}
          </Badge>
        ) : data ? (
          <>
            <Badge
              variant={STATUS_VARIANT[data.status]}
              className="gap-1"
            >
              {data.status === "verified" && <BadgeCheck className="size-3" />}
              {t(`businessVerification.status.${data.status}`)}
            </Badge>
            {data.verify_url && (
              <Button asChild size="sm" variant="outline">
                <a
                  href={data.verify_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("businessVerification.verifyOnMeta")}
                  <ExternalLink className="ml-1 size-3.5" />
                </a>
              </Button>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
