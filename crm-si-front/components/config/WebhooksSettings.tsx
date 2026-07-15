"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Braces,
  Loader2,
  Plus,
  Copy,
  KeyRound,
  Trash2,
  ListChecks,
  ShieldCheck,
} from "lucide-react"
import { useToast } from "@/components/Toast"
import { useTranslation } from "@/hooks/useTranslation"
import { usePermission } from "@/hooks/usePermission"
import {
  listWebhookEndpoints,
  getWebhookContactFields,
  createWebhookEndpoint,
  updateWebhookEndpoint,
  deleteWebhookEndpoint,
  rotateWebhookKey,
  listWebhookDeliveries,
  getWebhookDelivery,
  type WebhookEndpoint,
  type WebhookContactField,
  type WebhookDelivery,
  type WebhookDeliveryDetail,
} from "@/lib/api/webhooks"

function sampleValue(field: WebhookContactField): unknown {
  const firstChoice = field.options?.choices?.[0]

  switch (field.type) {
    case "number":
      return 100
    case "date":
      return "2026-07-15"
    case "boolean":
      return true
    case "select":
      return firstChoice ?? "opcion"
    case "multi_select":
      return firstChoice ? [firstChoice] : []
    case "email":
      return "dato@example.com"
    case "url":
      return "https://example.com"
    case "phone":
      return "+5491123456789"
    default:
      return "ejemplo"
  }
}

function buildContactsPayload(fields: WebhookContactField[]): string {
  const customData = Object.fromEntries(
    fields.map((field) => [field.key, sampleValue(field)]),
  )

  return JSON.stringify(
    {
    contacts: [
      {
        external_id: "cliente-123",
        name: "Ana Pérez",
        email: "ana@example.com",
        phone: "+5491123456789",
        ...(fields.length > 0 ? { custom_data: customData } : {}),
      },
    ],
    },
    null,
    2,
  )
}

const STATUS_VARIANTS: Record<
  WebhookDelivery["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  processed: "default",
  received: "secondary",
  partial: "outline",
  failed: "destructive",
  rejected: "destructive",
}

export function WebhooksSettings() {
  const { addToast } = useToast()
  const { t } = useTranslation()
  const canView = usePermission(["webhooks.view", "webhooks.manage"])
  const canManage = usePermission("webhooks.manage")

  const [loading, setLoading] = useState(true)
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([])
  const [customFields, setCustomFields] = useState<WebhookContactField[]>([])
  const payloadExample = useMemo(
    () => buildContactsPayload(customFields),
    [customFields],
  )

  // Modal de creación.
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newSecret, setNewSecret] = useState("")
  const [saving, setSaving] = useState(false)

  // Modal "una sola vez" con la key en plano (create + rotate).
  const [plainKey, setPlainKey] = useState<string | null>(null)

  // Drawer de deliveries.
  const [deliveriesFor, setDeliveriesFor] = useState<WebhookEndpoint | null>(null)

  useEffect(() => {
    if (canView) void load()
    else setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView])

  const load = async () => {
    setLoading(true)
    const [loadedEndpoints, loadedFields] = await Promise.all([
      listWebhookEndpoints(),
      getWebhookContactFields(),
    ])
    setEndpoints(loadedEndpoints)
    setCustomFields(loadedFields)
    setLoading(false)
  }

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      addToast({ type: "success", title: t("settings.webhooks.copied") })
    } catch {
      addToast({ type: "error", title: t("common.error") })
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const result = await createWebhookEndpoint({
      name: newName.trim(),
      ...(newSecret.trim() ? { signing_secret: newSecret.trim() } : {}),
    })
    setSaving(false)

    if (result.error || !result.data) {
      addToast({
        type: "error",
        title: t("common.error"),
        description: result.error,
      })
      return
    }

    setCreateOpen(false)
    setNewName("")
    setNewSecret("")
    setPlainKey(result.data.api_key ?? null)
    await load()
  }

  const handleToggle = async (endpoint: WebhookEndpoint, enabled: boolean) => {
    setEndpoints((prev) =>
      prev.map((e) => (e.id === endpoint.id ? { ...e, enabled } : e)),
    )
    const result = await updateWebhookEndpoint(endpoint.id, { enabled })
    if (result.error) {
      addToast({ type: "error", title: t("common.error"), description: result.error })
      await load()
    }
  }

  const handleRotate = async (endpoint: WebhookEndpoint) => {
    const result = await rotateWebhookKey(endpoint.id)
    if (result.error || !result.data) {
      addToast({ type: "error", title: t("common.error"), description: result.error })
      return
    }
    setPlainKey(result.data.api_key ?? null)
    await load()
  }

  const handleDelete = async (endpoint: WebhookEndpoint) => {
    if (!window.confirm(t("settings.webhooks.deleteConfirm", { name: endpoint.name })))
      return
    const result = await deleteWebhookEndpoint(endpoint.id)
    if (!result.ok) {
      addToast({ type: "error", title: t("common.error"), description: result.error })
      return
    }
    addToast({ type: "success", title: t("settings.webhooks.deleted") })
    await load()
  }

  if (!canView) return null

  return (
    <div className="space-y-4">
        {canManage && (
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t("settings.webhooks.create")}
            </Button>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ) : endpoints.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("settings.webhooks.empty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("settings.webhooks.colName")}</TableHead>
                  <TableHead>{t("settings.webhooks.colUrl")}</TableHead>
                  <TableHead>{t("settings.webhooks.colKey")}</TableHead>
                  <TableHead>{t("settings.webhooks.colLastReceived")}</TableHead>
                  <TableHead>{t("settings.webhooks.colEnabled")}</TableHead>
                  <TableHead className="text-right">
                    {t("settings.webhooks.colActions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.map((endpoint) => (
                  <TableRow key={endpoint.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {endpoint.name}
                        {endpoint.has_signing_secret && (
                          <Badge variant="secondary" className="gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            HMAC
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => copy(endpoint.public_url)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        title={endpoint.public_url}
                      >
                        <span className="max-w-[220px] truncate">
                          {endpoint.public_url}
                        </span>
                        <Copy className="w-3 h-3 shrink-0" />
                      </button>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground">
                        {endpoint.api_key_prefix}…
                      </code>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {endpoint.last_received_at
                        ? new Date(endpoint.last_received_at).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={endpoint.enabled}
                        disabled={!canManage}
                        onCheckedChange={(v) => handleToggle(endpoint, v)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title={t("settings.webhooks.viewDeliveries")}
                          onClick={() => setDeliveriesFor(endpoint)}
                        >
                          <ListChecks className="w-4 h-4" />
                        </Button>
                        {canManage && (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title={t("settings.webhooks.rotateKey")}
                              onClick={() => handleRotate(endpoint)}
                            >
                              <KeyRound className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title={t("settings.webhooks.delete")}
                              onClick={() => handleDelete(endpoint)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <PayloadGuide
          payload={payloadExample}
          customFields={customFields}
          onCopy={() => copy(payloadExample)}
        />

      {/* Modal de creación */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.webhooks.createTitle")}</DialogTitle>
            <DialogDescription>
              {t("settings.webhooks.createHint")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("settings.webhooks.name")}</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("settings.webhooks.namePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.webhooks.signingSecret")}</Label>
              <Input
                type="password"
                value={newSecret}
                onChange={(e) => setNewSecret(e.target.value)}
                placeholder={t("settings.webhooks.signingSecretPlaceholder")}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                {t("settings.webhooks.signingSecretHint")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={saving || !newName.trim()}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("settings.webhooks.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal "una sola vez" con la key */}
      <Dialog open={plainKey !== null} onOpenChange={(o) => !o && setPlainKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.webhooks.keyTitle")}</DialogTitle>
            <DialogDescription>
              {t("settings.webhooks.keyWarning")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-md bg-muted px-3 py-2 text-sm">
              {plainKey}
            </code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => plainKey && copy(plainKey)}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setPlainKey(null)}>
              {t("settings.webhooks.keyDone")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deliveriesFor && (
        <DeliveriesDialog
          endpoint={deliveriesFor}
          onClose={() => setDeliveriesFor(null)}
        />
      )}
    </div>
  )
}

function PayloadGuide({
  payload,
  customFields,
  onCopy,
}: {
  payload: string
  customFields: WebhookContactField[]
  onCopy: () => void
}) {
  const { t } = useTranslation()

  const fields = [
    {
      name: "contacts",
      description: t("settings.webhooks.payload.fields.contacts"),
      required: true,
    },
    {
      name: "external_id",
      description: t("settings.webhooks.payload.fields.externalId"),
      required: true,
    },
    {
      name: "name",
      description: t("settings.webhooks.payload.fields.name"),
      required: true,
    },
    {
      name: "email",
      description: t("settings.webhooks.payload.fields.email"),
      required: false,
    },
    {
      name: "phone",
      description: t("settings.webhooks.payload.fields.phone"),
      required: false,
    },
    {
      name: "custom_data",
      description: t("settings.webhooks.payload.fields.customData"),
      required: false,
    },
  ]

  return (
    <section
      aria-labelledby="webhook-payload-title"
      className="mt-8 border-t border-border pt-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h4
            id="webhook-payload-title"
            className="text-base font-semibold text-foreground"
          >
            {t("settings.webhooks.payload.title")}
          </h4>
          <p className="max-w-[68ch] text-sm leading-6 text-muted-foreground">
            {t("settings.webhooks.payload.description")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={onCopy}
        >
          <Copy className="mr-2 size-3.5" />
          {t("settings.webhooks.payload.copy")}
        </Button>
      </div>

      <div className="mt-5">
        <h5 className="text-sm font-semibold text-foreground">
          {t("settings.webhooks.payload.authenticationTitle")}
        </h5>
        <p className="mt-1 max-w-[68ch] text-xs leading-5 text-muted-foreground">
          {t("settings.webhooks.payload.authenticationDescription")}
        </p>
        <dl className="mt-3 divide-y divide-border border-y border-border">
          <div className="grid gap-1 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
            <dt>
              <code className="inline-flex items-center gap-2 font-mono text-xs font-medium text-foreground">
                <KeyRound className="size-3.5" aria-hidden="true" />
                X-Api-Key
              </code>
            </dt>
            <dd className="text-xs leading-5 text-muted-foreground">
              {t("settings.webhooks.payload.apiKeyDescription")}
              <code className="ml-1 font-mono text-foreground">
                X-Api-Key: whk_TU_API_KEY
              </code>
            </dd>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
            <dt>
              <code className="inline-flex items-center gap-2 font-mono text-xs font-medium text-foreground">
                <Braces className="size-3.5" aria-hidden="true" />
                Content-Type
              </code>
            </dt>
            <dd className="text-xs leading-5 text-muted-foreground">
              {t("settings.webhooks.payload.contentTypeDescription")}
              <code className="ml-1 font-mono text-foreground">
                application/json
              </code>
            </dd>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
            <dt>
              <code className="inline-flex items-center gap-2 font-mono text-xs font-medium text-foreground">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                X-Signature-256
              </code>
            </dt>
            <dd className="text-xs leading-5 text-muted-foreground">
              {t("settings.webhooks.payload.signatureDescription")}
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {t("settings.webhooks.payload.apiKeyWarning")}
        </p>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(16rem,0.75fr)]">
        <div className="overflow-hidden rounded-lg border border-border bg-muted/40">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-2 font-medium text-foreground">
              <Braces className="size-3.5" aria-hidden="true" />
              JSON
            </span>
            <span className="font-mono">application/json</span>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6 text-foreground">
            <code>{payload}</code>
          </pre>
        </div>

        <div>
          <h5 className="text-sm font-semibold text-foreground">
            {t("settings.webhooks.payload.fieldsTitle")}
          </h5>
          <dl className="mt-2 divide-y divide-border border-y border-border">
            {fields.map((field) => (
              <div key={field.name} className="py-3">
                <dt className="flex items-center gap-2">
                  <code className="font-mono text-xs font-medium text-foreground">
                    {field.name}
                  </code>
                  <span className="text-[11px] text-muted-foreground">
                    {field.required
                      ? t("settings.webhooks.payload.required")
                      : t("settings.webhooks.payload.optional")}
                  </span>
                </dt>
                <dd className="mt-1 text-xs leading-5 text-muted-foreground">
                  {field.description}
                </dd>
              </div>
            ))}
          </dl>

          <h5 className="mt-6 text-sm font-semibold text-foreground">
            {t("settings.webhooks.payload.customFieldsTitle")}
          </h5>
          {customFields.length === 0 ? (
            <p className="mt-2 border-y border-border py-3 text-xs leading-5 text-muted-foreground">
              {t("settings.webhooks.payload.noCustomFields")}
            </p>
          ) : (
            <dl className="mt-2 divide-y divide-border border-y border-border">
              {customFields.map((field) => (
                <div key={field.key} className="py-3">
                  <dt className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <code className="font-mono text-xs font-medium text-foreground">
                      {field.key}
                    </code>
                    <span className="text-xs text-muted-foreground">
                      {field.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {t(`fields.typeLabels.${field.type}`)}
                      {" · "}
                      {field.is_required
                        ? t("settings.webhooks.payload.required")
                        : t("settings.webhooks.payload.optional")}
                    </span>
                  </dt>
                  {(field.options?.choices?.length ?? 0) > 0 && (
                    <dd className="mt-1 text-xs leading-5 text-muted-foreground">
                      {t("settings.webhooks.payload.allowedValues", {
                        values: field.options?.choices?.join(", ") ?? "",
                      })}
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      <p className="mt-5 rounded-md border border-border bg-muted/30 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
        <strong className="font-medium text-foreground">
          {t("settings.webhooks.payload.upsertTitle")}
        </strong>{" "}
        {t("settings.webhooks.payload.upsertDescription")}
      </p>
    </section>
  )
}

function DeliveriesDialog({
  endpoint,
  onClose,
}: {
  endpoint: WebhookEndpoint
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([])
  const [detail, setDetail] = useState<WebhookDeliveryDetail | null>(null)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      const page = await listWebhookDeliveries(endpoint.id)
      setDeliveries(page?.data ?? [])
      setLoading(false)
    })()
  }, [endpoint.id])

  const openDetail = async (deliveryId: number) => {
    setDetail(await getWebhookDelivery(endpoint.id, deliveryId))
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t("settings.webhooks.deliveriesTitle", { name: endpoint.name })}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : deliveries.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("settings.webhooks.deliveriesEmpty")}
          </p>
        ) : (
          <div className="max-h-[50vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("settings.webhooks.colStatus")}</TableHead>
                  <TableHead>{t("settings.webhooks.colResult")}</TableHead>
                  <TableHead>{t("settings.webhooks.colDate")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((d) => (
                  <TableRow
                    key={d.id}
                    className="cursor-pointer"
                    onClick={() => openDetail(d.id)}
                  >
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[d.status]}>{d.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.created === null && d.updated === null && d.failed === null
                        ? "—"
                        : `+${d.created ?? 0} / ~${d.updated ?? 0} / !${d.failed ?? 0}`}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.created_at
                        ? new Date(d.created_at).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {detail && (
          <div className="space-y-2 border-t pt-4">
            <Label>{t("settings.webhooks.detailPayload")}</Label>
            <pre className="max-h-[30vh] overflow-auto rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(
                { result: detail.result, error: detail.error, payload: detail.payload },
                null,
                2,
              )}
            </pre>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
