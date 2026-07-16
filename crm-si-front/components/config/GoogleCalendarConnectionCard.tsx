"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/Toast"
import { useTranslation } from "@/hooks/useTranslation"
import {
  disconnectGoogleCalendar,
  getGoogleCalendarAuthorizationUrl,
  getGoogleCalendarConnection,
  type GoogleCalendarConnection,
} from "@/lib/api/google-calendar"

export function GoogleCalendarConnectionCard() {
  const { addToast } = useToast()
  const { t } = useTranslation()

  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [connection, setConnection] = useState<GoogleCalendarConnection | null>(null)

  useEffect(() => {
    loadConnection()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const result = params.get("google_calendar")
    if (!result) return

    if (result === "connected") {
      addToast({ type: "success", title: t("settings.googleCalendar.connected") })
    } else if (result === "expired") {
      addToast({
        type: "error",
        title: t("common.error"),
        description: t("settings.googleCalendar.stateExpired"),
      })
    } else {
      addToast({
        type: "error",
        title: t("common.error"),
        description: t("settings.googleCalendar.connectError"),
      })
    }

    params.delete("google_calendar")
    const newSearch = params.toString()
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadConnection = async () => {
    setLoading(true)
    const data = await getGoogleCalendarConnection()
    setConnection(data)
    setLoading(false)
  }

  const handleConnect = async () => {
    setConnecting(true)
    const result = await getGoogleCalendarAuthorizationUrl()
    setConnecting(false)

    if (result.error || !result.data) {
      addToast({
        type: "error",
        title: t("common.error"),
        description: result.error ?? t("settings.googleCalendar.connectError"),
      })
      return
    }

    window.location.href = result.data
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    const result = await disconnectGoogleCalendar()
    setDisconnecting(false)

    if (result.error) {
      addToast({ type: "error", title: t("common.error"), description: result.error })
      return
    }

    setConnection(null)
    addToast({ type: "success", title: t("settings.googleCalendar.disconnected") })
  }

  const isConnected = connection?.status === "connected"
  const needsReauth = connection?.status === "needs_reauth"

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t("common.loading")}
      </div>
    )
  }

  if (isConnected || needsReauth) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          <p className="text-foreground">{connection?.google_email}</p>
          {needsReauth && (
            <p className="mt-1 text-muted-foreground">
              {t("settings.googleCalendar.needsReauthHint")}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {needsReauth && (
            <Button size="sm" onClick={handleConnect} disabled={connecting}>
              {connecting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("settings.googleCalendar.reconnect")}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleDisconnect} disabled={disconnecting}>
            {disconnecting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t("settings.googleCalendar.disconnect")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {t("settings.googleCalendar.notConnectedHint")}
      </p>
      <Button size="sm" onClick={handleConnect} disabled={connecting}>
        {connecting && <Loader2 className="mr-2 size-4 animate-spin" />}
        {t("settings.googleCalendar.connect")}
      </Button>
    </div>
  )
}
