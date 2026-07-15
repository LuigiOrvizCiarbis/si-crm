"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, PlugZap, RefreshCw } from "lucide-react"
import { useToast } from "@/components/Toast"
import { useTranslation } from "@/hooks/useTranslation"
import { useAuthStore } from "@/store/useAuthStore"
import { isAdminRole } from "@/lib/permissions"
import {
  getWooConfig,
  updateWooConfig,
  testWooConfig,
  syncWooProducts,
} from "@/lib/api/woocommerce"

export function WooCommerceSettings() {
  const { addToast } = useToast()
  const { t } = useTranslation()
  const role = useAuthStore((state) => state.role)
  const permissions = useAuthStore((state) => state.permissions)
  const isAdmin = useMemo(
    () => isAdminRole(role, permissions),
    [role, permissions],
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const [storeUrl, setStoreUrl] = useState("")
  const [enabled, setEnabled] = useState(false)
  const [consumerKey, setConsumerKey] = useState("")
  const [consumerSecret, setConsumerSecret] = useState("")
  const [hasCredentials, setHasCredentials] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    const config = await getWooConfig()
    if (config) {
      setStoreUrl(config.store_url ?? "")
      setEnabled(config.enabled)
      setHasCredentials(config.has_credentials)
      setLastSyncedAt(config.last_synced_at)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)

    const result = await updateWooConfig({
      store_url: storeUrl.trim(),
      enabled,
      // Write-only: solo se mandan si el usuario cargó unas nuevas.
      ...(consumerKey.trim() ? { consumer_key: consumerKey.trim() } : {}),
      ...(consumerSecret.trim()
        ? { consumer_secret: consumerSecret.trim() }
        : {}),
    })

    setSaving(false)

    if (result.error) {
      addToast({
        type: "error",
        title: t("common.error"),
        description: result.error,
      })
      return
    }

    if (result.data) {
      setHasCredentials(result.data.has_credentials)
    }
    setConsumerKey("")
    setConsumerSecret("")

    addToast({ type: "success", title: t("settings.woocommerce.saved") })
  }

  const handleTest = async () => {
    setTesting(true)

    const result = await testWooConfig({
      store_url: storeUrl.trim(),
      ...(consumerKey.trim() ? { consumer_key: consumerKey.trim() } : {}),
      ...(consumerSecret.trim()
        ? { consumer_secret: consumerSecret.trim() }
        : {}),
    })

    setTesting(false)

    if (!result.ok) {
      const map: Record<string, string> = {
        invalid_credentials: "settings.woocommerce.testErrorCredentials",
        unreachable: "settings.woocommerce.testErrorUnreachable",
      }
      const key = map[result.error_code ?? ""]
      addToast({
        type: "error",
        title: t("common.error"),
        // invalid_url trae un mensaje propio del back; el resto usa i18n.
        description: key
          ? t(key)
          : result.error_message ?? t("settings.woocommerce.testErrorUnknown"),
      })
      return
    }

    addToast({
      type: "success",
      title: t("settings.woocommerce.testOk"),
    })
  }

  const handleSync = async () => {
    setSyncing(true)
    const result = await syncWooProducts()
    setSyncing(false)

    if (result.error) {
      addToast({
        type: "error",
        title: t("common.error"),
        description: result.error,
      })
      return
    }

    if (result.data) {
      setLastSyncedAt(result.data.last_synced_at)
      addToast({
        type: "success",
        title: t("settings.woocommerce.syncOk"),
        description: t("settings.woocommerce.syncResult", {
          created: result.data.created,
          updated: result.data.updated,
        }),
      })
    }
  }

  if (!isAdmin) {
    return null
  }

  const canSync = hasCredentials && !!storeUrl.trim()

  return (
    <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("settings.woocommerce.enabled")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("settings.woocommerce.enabledHint")}
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="space-y-2">
              <Label>{t("settings.woocommerce.storeUrl")}</Label>
              <Input
                type="url"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                placeholder="https://mitienda.com"
              />
              <p className="text-xs text-muted-foreground">
                {t("settings.woocommerce.storeUrlHint")}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t("settings.woocommerce.consumerKey")}</Label>
              <Input
                type="password"
                value={consumerKey}
                onChange={(e) => setConsumerKey(e.target.value)}
                placeholder={
                  hasCredentials
                    ? t("settings.woocommerce.credentialSet")
                    : "ck_..."
                }
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("settings.woocommerce.consumerSecret")}</Label>
              <Input
                type="password"
                value={consumerSecret}
                onChange={(e) => setConsumerSecret(e.target.value)}
                placeholder={
                  hasCredentials
                    ? t("settings.woocommerce.credentialSet")
                    : "cs_..."
                }
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                {t("settings.woocommerce.credentialsHint")}
              </p>
            </div>

            {lastSyncedAt && (
              <p className="text-xs text-muted-foreground">
                {t("settings.woocommerce.lastSynced", {
                  date: new Date(lastSyncedAt).toLocaleString(),
                })}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSync}
                disabled={syncing || saving || testing || !canSync}
              >
                {syncing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {syncing
                  ? t("settings.woocommerce.syncing")
                  : t("settings.woocommerce.sync")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={
                  testing ||
                  saving ||
                  !storeUrl.trim() ||
                  (!hasCredentials &&
                    (!consumerKey.trim() || !consumerSecret.trim()))
                }
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <PlugZap className="w-4 h-4 mr-2" />
                )}
                {testing
                  ? t("settings.woocommerce.testing")
                  : t("settings.woocommerce.test")}
              </Button>
              <Button onClick={handleSave} disabled={saving || testing}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("common.save")}
              </Button>
            </div>
          </>
        )}
    </div>
  )
}
