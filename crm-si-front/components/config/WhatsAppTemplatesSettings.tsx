"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, ChevronDown, FileImage, Loader2, Plus, RefreshCw, Trash2, X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/Toast"
import { usePermission } from "@/hooks/usePermission"
import { createTemplate, deleteTemplate, getManagedTemplates, syncTemplates, uploadTemplateHeader } from "@/lib/api/templates"
import { getChannels } from "@/lib/api/channels"
import { Channel, WhatsAppTemplate } from "@/data/types"
import { ChannelType } from "@/data/enums"
import { cn } from "@/lib/utils"

type HeaderFormat = "NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT"
type ButtonDraft = { type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER"; text: string; url?: string; phone_number?: string }

const statusStyles: Record<string, string> = {
  APPROVED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  REJECTED: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  DISABLED: "border-muted bg-muted text-muted-foreground",
}

const statusLabel: Record<string, string> = {
  APPROVED: "Aprobada", PENDING: "Pendiente", REJECTED: "Rechazada", DISABLED: "Deshabilitada",
  IN_APPEAL: "En apelación", PAUSED: "Pausada", PENDING_DELETION: "Eliminación pendiente",
  DELETED: "Eliminada", LIMIT_EXCEEDED: "Límite excedido", UNKNOWN: "Desconocida",
}

export function WhatsAppTemplatesSettings() {
  const canCreate = usePermission("templates.create")
  const canDelete = usePermission("templates.delete")
  const canSync = usePermission("templates.sync")
  const { addToast } = useToast()
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelId, setChannelId] = useState<number | null>(null)
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [query, setQuery] = useState("")
  const [stateFilter, setStateFilter] = useState("ALL")
  const [deleteTarget, setDeleteTarget] = useState<WhatsAppTemplate | null>(null)
  const [deletingTemplateId, setDeletingTemplateId] = useState<number | null>(null)

  const whatsappChannels = useMemo(
    () => channels.filter((channel) => channel.type === ChannelType.WHATSAPP && channel.whatsapp_config),
    [channels],
  )

  const loadTemplates = useCallback(async (id: number) => {
    setLoading(true)
    try {
      setTemplates(await getManagedTemplates(id))
    } catch (error: any) {
      addToast({ type: "error", title: error?.message || "No se pudieron cargar las plantillas" })
    } finally { setLoading(false) }
  }, [addToast])

  useEffect(() => {
    getChannels().then((loaded) => {
      setChannels(loaded)
      const first = loaded.find((channel) => channel.type === ChannelType.WHATSAPP && channel.whatsapp_config)
      if (first) setChannelId(first.id)
    }).catch((error: any) => addToast({ type: "error", title: error?.message || "No se pudieron cargar los canales" }))
  }, [addToast])

  useEffect(() => { if (channelId) void loadTemplates(channelId) }, [channelId, loadTemplates])

  const visible = useMemo(() => templates.filter((template) => {
    const matchesQuery = !query.trim() || template.name.toLowerCase().includes(query.trim().toLowerCase())
    const matchesState = stateFilter === "ALL" || template.status === stateFilter
    return matchesQuery && matchesState
  }), [query, stateFilter, templates])

  const handleSync = async () => {
    if (!channelId) return
    setSyncing(true)
    try {
      const result = await syncTemplates(channelId)
      await loadTemplates(channelId)
      addToast({ type: "success", title: result.message || "Plantillas sincronizadas" })
    } catch (error: any) { addToast({ type: "error", title: error?.message || "No se pudieron sincronizar" })
    } finally { setSyncing(false) }
  }

  const handleDelete = async () => {
    if (!channelId || !deleteTarget || deletingTemplateId !== null) return

    const templateId = deleteTarget.id
    setDeletingTemplateId(templateId)
    try {
      await deleteTemplate(channelId, templateId)
      setTemplates((current) => current.filter((template) => template.id !== templateId))
      setDeleteTarget(null)
      addToast({ type: "success", title: "Plantilla eliminada de Meta y del CRM." })
    } catch (error: any) {
      addToast({ type: "error", title: error?.message || "No se pudo eliminar la plantilla" })
    } finally {
      setDeletingTemplateId(null)
    }
  }

  if (loading && channels.length === 0) {
    return <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Cargando plantillas…</div>
  }

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">Cuenta de WhatsApp</p>
        <select value={channelId ?? ""} onChange={(event) => setChannelId(Number(event.target.value))} className="mt-1 h-9 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
          {whatsappChannels.length === 0 && <option value="">No hay cuentas conectadas</option>}
          {whatsappChannels.map((channel) => <option key={channel.id} value={channel.id}>{channel.name} · {channel.whatsapp_config?.display_phone_number || channel.whatsapp_config?.phone_number_id}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        {canSync && <Button variant="outline" size="sm" onClick={handleSync} disabled={!channelId || syncing}>
          <RefreshCw className={cn("mr-2 size-4", syncing && "animate-spin")} /> Sincronizar
        </Button>}
        {canCreate && <Button size="sm" onClick={() => setShowForm((current) => !current)} disabled={!channelId}>
          {showForm ? <X className="mr-2 size-4" /> : <Plus className="mr-2 size-4" />} {showForm ? "Cerrar" : "Crear plantilla"}
        </Button>}
      </div>
    </div>

    {showForm && channelId && <TemplateForm channelId={channelId} onCreated={async () => { setShowForm(false); await loadTemplates(channelId) }} />}

    <div className="flex flex-col gap-3 sm:flex-row">
      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre…" className="sm:max-w-xs" />
      <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-48">
        <option value="ALL">Todos los estados</option><option value="APPROVED">Aprobadas</option><option value="PENDING">Pendientes</option><option value="REJECTED">Rechazadas</option><option value="DISABLED">Deshabilitadas</option>
      </select>
    </div>

    <div className="overflow-hidden rounded-xl border border-border">
      {loading ? <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Actualizando…</div> : visible.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">No hay plantillas que coincidan con los filtros.</div> : <div className="divide-y divide-border">
        {visible.map((template) => <div key={template.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-medium">{template.name}</p><Badge variant="outline" className={cn("text-[11px]", statusStyles[template.status])}>{statusLabel[template.status] || template.status}</Badge><Badge variant="secondary" className="text-[11px]">{template.category}</Badge><span className="text-xs text-muted-foreground">{template.language}</span></div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{template.components?.find((component) => component.type?.toUpperCase() === "BODY")?.text || "Sin cuerpo"}</p>
            {template.rejected_reason && <p className="mt-2 text-xs text-red-600 dark:text-red-400">Motivo: {template.rejected_reason}</p>}
          </div><div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-muted-foreground">{template.synced_at ? new Date(template.synced_at).toLocaleDateString() : "—"}</span>
            {canDelete && <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setDeleteTarget(template)}
              disabled={deletingTemplateId === template.id}
              aria-label={`Eliminar plantilla ${template.name} (${template.language})`}
              title="Eliminar plantilla"
            >
              {deletingTemplateId === template.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            </Button>}
          </div>
        </div>)}
      </div>}
    </div>

    <AlertDialog
      open={deleteTarget !== null}
      onOpenChange={(open) => !open && deletingTemplateId === null && setDeleteTarget(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar esta plantilla permanentemente?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará <strong className="font-medium text-foreground">{deleteTarget?.name}</strong> ({deleteTarget?.language}) de Meta y del CRM. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletingTemplateId !== null}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              void handleDelete()
            }}
            disabled={deletingTemplateId !== null}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deletingTemplateId !== null && <Loader2 className="mr-2 size-4 animate-spin" />}
            Eliminar de Meta y del CRM
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
}

function TemplateForm({ channelId, onCreated }: { channelId: number; onCreated: () => Promise<void> }) {
  const { addToast } = useToast()
  const [name, setName] = useState("")
  const [language, setLanguage] = useState("es_AR")
  const [category, setCategory] = useState<"MARKETING" | "UTILITY">("UTILITY")
  const [headerFormat, setHeaderFormat] = useState<HeaderFormat>("NONE")
  const [headerText, setHeaderText] = useState("")
  const [headerFile, setHeaderFile] = useState<File | null>(null)
  const [body, setBody] = useState("")
  const [footer, setFooter] = useState("")
  const [examples, setExamples] = useState<Record<string, string>>({})
  const [buttons, setButtons] = useState<ButtonDraft[]>([])
  const [submitting, setSubmitting] = useState(false)
  const variables = useMemo(() => [...new Set(Array.from(body.matchAll(/\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g)).map((match) => match[1]))], [body])

  useEffect(() => setExamples((current) => Object.fromEntries(variables.map((variable) => [variable, current[variable] || ""]))), [variables])

  const submit = async () => {
    if (!name.match(/^[a-z0-9_]+$/)) return addToast({ type: "error", title: "El nombre solo puede usar minúsculas, números y guiones bajos." })
    if (!body.trim()) return addToast({ type: "error", title: "El cuerpo de la plantilla es obligatorio." })
    if (variables.some((variable) => !examples[variable]?.trim())) return addToast({ type: "error", title: "Agregá un ejemplo para cada variable." })
    if (headerFormat !== "NONE" && headerFormat !== "TEXT" && !headerFile) return addToast({ type: "error", title: "Seleccioná el archivo de ejemplo del encabezado." })
    setSubmitting(true)
    try {
      let headerHandle: string | undefined
      if (headerFile) headerHandle = (await uploadTemplateHeader(channelId, headerFile)).header_handle
      const components: any[] = []
      if (headerFormat === "TEXT") components.push({ type: "HEADER", format: "TEXT", text: headerText.trim() })
      if (headerHandle) components.push({ type: "HEADER", format: headerFormat, example: { header_handle: [headerHandle] } })
      components.push({ type: "BODY", text: body.trim(), ...(variables.length ? { example: { body_text_named_params: variables.map((param_name) => ({ param_name, example: examples[param_name].trim() })) } } : {}) })
      if (footer.trim()) components.push({ type: "FOOTER", text: footer.trim() })
      if (buttons.length) components.push({ type: "BUTTONS", buttons: buttons.map(({ type, text, url, phone_number }) => ({ type, text, ...(url ? { url } : {}), ...(phone_number ? { phone_number } : {}) })) })
      await createTemplate(channelId, { name: name.trim(), language, category, parameter_format: "named", components })
      addToast({ type: "success", title: "Plantilla enviada a revisión de Meta." })
      await onCreated()
    } catch (error: any) { addToast({ type: "error", title: error?.message || "No se pudo crear la plantilla" })
    } finally { setSubmitting(false) }
  }

  return <Card className="overflow-hidden border-primary/20 shadow-sm"><CardHeader className="bg-primary/[0.04] pb-4"><CardTitle className="text-base">Nueva plantilla <span className="ml-2 text-xs font-normal text-muted-foreground">Se enviará a revisión de Meta</span></CardTitle></CardHeader><CardContent className="grid gap-6 pt-6 lg:grid-cols-[1.3fr_0.7fr]">
    <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-sm font-medium">Nombre<Input value={name} onChange={(event) => setName(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))} placeholder="confirmacion_pedido" /></label><label className="space-y-1.5 text-sm font-medium">Idioma<select value={language} onChange={(event) => setLanguage(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="es_AR">Español (Argentina)</option><option value="es_MX">Español (México)</option><option value="en_US">English (US)</option><option value="pt_BR">Português (Brasil)</option></select></label></div>
      <label className="space-y-1.5 text-sm font-medium">Categoría<select value={category} onChange={(event) => setCategory(event.target.value as "MARKETING" | "UTILITY")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="UTILITY">Utilidad</option><option value="MARKETING">Marketing</option></select></label>
      <div className="space-y-3 rounded-lg border border-border p-4"><p className="text-sm font-medium">Encabezado <span className="font-normal text-muted-foreground">(opcional)</span></p><select value={headerFormat} onChange={(event) => { setHeaderFormat(event.target.value as HeaderFormat); setHeaderFile(null) }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="NONE">Sin encabezado</option><option value="TEXT">Texto</option><option value="IMAGE">Imagen</option><option value="VIDEO">Video</option><option value="DOCUMENT">Documento PDF</option></select>{headerFormat === "TEXT" && <Input value={headerText} onChange={(event) => setHeaderText(event.target.value)} placeholder="Actualización de tu pedido" />}{headerFormat !== "NONE" && headerFormat !== "TEXT" && <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground hover:bg-muted/40"><FileImage className="size-4" /><span className="truncate">{headerFile?.name || "Elegir archivo de ejemplo"}</span><input type="file" className="sr-only" accept={headerFormat === "IMAGE" ? "image/jpeg,image/png" : headerFormat === "VIDEO" ? "video/mp4" : "application/pdf"} onChange={(event) => setHeaderFile(event.target.files?.[0] || null)} /></label>}</div>
      <label className="space-y-1.5 text-sm font-medium">Cuerpo<Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={5} placeholder="Hola {{nombre}}, tu pedido {{numero_pedido}} está listo." /><span className="block text-xs font-normal text-muted-foreground">Usá variables nombradas como &#123;&#123;nombre&#125;&#125;.</span></label>
      {variables.length > 0 && <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4"><p className="text-sm font-medium">Ejemplos de variables</p>{variables.map((variable) => <label key={variable} className="flex items-center gap-3 text-sm"><code className="min-w-28 rounded bg-background px-2 py-1 text-xs">&#123;&#123;{variable}&#125;&#125;</code><Input value={examples[variable] || ""} onChange={(event) => setExamples((current) => ({ ...current, [variable]: event.target.value }))} placeholder="Ejemplo para revisión" /></label>)}</div>}
      <label className="space-y-1.5 text-sm font-medium">Pie <span className="font-normal text-muted-foreground">(opcional)</span><Input value={footer} onChange={(event) => setFooter(event.target.value)} maxLength={60} placeholder="Respondé AYUDA si necesitás asistencia" /></label>
      <div className="space-y-3"><div className="flex items-center justify-between"><p className="text-sm font-medium">Botones <span className="font-normal text-muted-foreground">(opcional, máximo 3)</span></p>{buttons.length < 3 && <Button type="button" size="sm" variant="outline" onClick={() => setButtons((current) => [...current, { type: "QUICK_REPLY", text: "" }])}><Plus className="mr-1 size-3" /> Agregar</Button>}</div>{buttons.map((button, index) => <div key={index} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[140px_1fr_auto]"><select value={button.type} onChange={(event) => setButtons((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, type: event.target.value as ButtonDraft["type"] } : item))} className="h-10 rounded-md border border-input bg-background px-2 text-sm"><option value="QUICK_REPLY">Respuesta rápida</option><option value="URL">URL</option><option value="PHONE_NUMBER">Teléfono</option></select><Input value={button.text} onChange={(event) => setButtons((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item))} placeholder="Texto del botón" />{button.type === "URL" && <Input value={button.url || ""} onChange={(event) => setButtons((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item))} placeholder="https://…" />}{button.type === "PHONE_NUMBER" && <Input value={button.phone_number || ""} onChange={(event) => setButtons((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, phone_number: event.target.value } : item))} placeholder="54911…" />}<Button type="button" variant="ghost" size="icon" onClick={() => setButtons((current) => current.filter((_, itemIndex) => itemIndex !== index))}><X className="size-4" /></Button></div>)}</div>
      <div className="flex justify-end"><Button onClick={submit} disabled={submitting}>{submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />} Enviar a revisión</Button></div>
    </div>
    <div className="rounded-2xl bg-[#e7f7ed] p-4 dark:bg-emerald-950/30"><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-800/70 dark:text-emerald-300/70">Vista previa</p><div className="rounded-xl rounded-tl-sm bg-white p-3 text-sm text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200"><p className="mb-2 text-[11px] font-medium text-slate-400">{headerFormat === "TEXT" ? headerText || "Encabezado" : headerFormat !== "NONE" ? headerFormat : ""}</p><p className="whitespace-pre-wrap">{body || "El cuerpo de tu plantilla aparecerá acá."}</p>{footer && <p className="mt-2 text-xs text-slate-400">{footer}</p>}{buttons.length > 0 && <div className="mt-3 space-y-1 border-t border-slate-100 pt-2 dark:border-slate-800">{buttons.map((button, index) => <p key={index} className="text-center text-xs font-medium text-emerald-600">{button.text || "Botón"}</p>)}</div>}</div><p className="mt-4 text-xs leading-5 text-emerald-900/60 dark:text-emerald-200/60">Meta revisará el contenido antes de habilitarlo. El estado inicial aparecerá como pendiente.</p></div>
  </CardContent></Card>
}
