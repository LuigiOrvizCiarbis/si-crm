"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Bot, Loader2, RefreshCw, PlugZap, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/Toast"
import { useTranslation } from "@/hooks/useTranslation"
import { useAuthStore } from "@/store/useAuthStore"
import { isAdminRole } from "@/lib/permissions"
import {
  getAiConfig,
  getAiModels,
  updateAiConfig,
  testAiConfig,
  type AiProviderId,
} from "@/lib/api/ai-config"

const PROVIDERS: { id: AiProviderId; label: string; defaultModel: string }[] = [
  { id: "claude", label: "Claude (Anthropic)", defaultModel: "claude-opus-4-8" },
  { id: "openai", label: "OpenAI (GPT)", defaultModel: "gpt-4o" },
]

const SYSTEM_PROMPT_MAX_LENGTH = 20000

export function AiAssistantCard() {
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
  const [provider, setProvider] = useState<AiProviderId>("claude")
  const [model, setModel] = useState("")
  const [enabled, setEnabled] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [hasApiKey, setHasApiKey] = useState(false)
  const [models, setModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [testing, setTesting] = useState(false)
  // Aviso persistente si el modelo elegido no procesa imágenes (lo arma el back).
  const [visionWarning, setVisionWarning] = useState<string | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    const config = await getAiConfig()
    if (config) {
      setProvider(config.provider ?? "claude")
      setModel(config.model ?? "")
      setEnabled(config.enabled)
      setSystemPrompt(config.system_prompt ?? "")
      setHasApiKey(config.has_api_key)
      // Si ya hay una key guardada, precargamos la lista de modelos.
      if (config.has_api_key) {
        void fetchModels()
      }
    }
    setLoading(false)
  }

  const fetchModels = async () => {
    setLoadingModels(true)
    const list = await getAiModels()
    setModels(list)
    setLoadingModels(false)
    return list
  }

  const handleFetchModels = async () => {
    const list = await fetchModels()
    if (list.length === 0) {
      addToast({
        type: "error",
        title: t("settings.aiAssistant.modelsEmpty"),
      })
    }
  }

  const providerMeta = PROVIDERS.find((p) => p.id === provider) ?? PROVIDERS[0]
  const systemPromptLength = systemPrompt.length
  const isSystemPromptNearLimit =
    systemPromptLength >= SYSTEM_PROMPT_MAX_LENGTH * 0.9
  const systemPromptLimitLabel = SYSTEM_PROMPT_MAX_LENGTH.toLocaleString()

  const handleSave = async () => {
    setSaving(true)

    const result = await updateAiConfig({
      provider,
      model: model.trim() || null,
      enabled,
      system_prompt: systemPrompt.trim() || null,
      // Solo se manda la key si el usuario escribió una nueva (write-only).
      ...(apiKey.trim() ? { api_key: apiKey.trim() } : {}),
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
      setHasApiKey(result.data.has_api_key)
    }
    // El back avisa si el modelo guardado no procesa imágenes: se muestra como
    // banner persistente bajo el campo de modelo.
    setVisionWarning(result.modelVisionWarning ?? null)
    // Si acabamos de guardar una key nueva, refrescamos los modelos del proveedor.
    if (apiKey.trim() && result.data?.has_api_key) {
      void fetchModels()
    }
    setApiKey("")

    addToast({ type: "success", title: t("settings.aiAssistant.saved") })
  }

  const handleTest = async () => {
    setTesting(true)

    const result = await testAiConfig({
      provider,
      model: model.trim() || null,
      system_prompt: systemPrompt.trim() || null,
      // Solo mandamos la key si el usuario escribió una nueva sin guardar aún.
      ...(apiKey.trim() ? { api_key: apiKey.trim() } : {}),
    })

    setTesting(false)

    // El back devuelve el aviso de visión también al probar (haya o no error de
    // key), así el usuario lo ve sin necesidad de guardar.
    setVisionWarning(result.model_vision_warning ?? null)

    if (!result.ok) {
      const map: Record<string, string> = {
        invalid_key: "settings.aiAssistant.testErrorInvalidKey",
        no_credit: "settings.aiAssistant.testErrorNoCredit",
        rate_limit: "settings.aiAssistant.testErrorRateLimit",
      }
      const key = map[result.error_code ?? ""] ?? "settings.aiAssistant.testErrorUnknown"
      addToast({
        type: "error",
        title: t("common.error"),
        description: t(key),
      })
      return
    }

    // Éxito. Si el proveedor devolvió el conteo de tokens, informamos si el
    // system prompt alcanza el mínimo de prompt caching.
    const { prompt_tokens: tokens, cache_min_tokens: min } = result
    let description = t("settings.aiAssistant.testOk")
    if (tokens != null) {
      description = t("settings.aiAssistant.testOkTokens", { tokens })
      if (min != null) {
        description +=
          " " +
          (tokens >= min
            ? t("settings.aiAssistant.testCacheOk", { min })
            : t("settings.aiAssistant.testCacheBelow", { tokens, min }))
      }
    }

    addToast({
      type: "success",
      title: t("settings.aiAssistant.testOk"),
      description,
    })
  }

  if (!isAdmin) {
    return null
  }

  return (
    <Card className="rounded-2xl border-[#1e2533]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          {t("settings.aiAssistant.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("settings.aiAssistant.enabled")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("settings.aiAssistant.enabledHint")}
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="space-y-2">
              <Label>{t("settings.aiAssistant.provider")}</Label>
              <Select
                value={provider}
                onValueChange={(value) => {
                  setProvider(value as AiProviderId)
                  // La lista cacheada es del proveedor anterior: la descartamos.
                  setModels([])
                  // El aviso de visión era del modelo/proveedor anterior.
                  setVisionWarning(null)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("settings.aiAssistant.apiKey")}</Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  hasApiKey
                    ? t("settings.aiAssistant.apiKeySet")
                    : t("settings.aiAssistant.apiKeyPlaceholder")
                }
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                {t("settings.aiAssistant.apiKeyHint")}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("settings.aiAssistant.model")}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={handleFetchModels}
                  disabled={loadingModels || !hasApiKey}
                >
                  {loadingModels ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  )}
                  {t("settings.aiAssistant.fetchModels")}
                </Button>
              </div>
              {models.length > 0 ? (
                <Select
                  value={model || undefined}
                  onValueChange={(value) => {
                    setModel(value)
                    setVisionWarning(null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("settings.aiAssistant.modelPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value)
                    setVisionWarning(null)
                  }}
                  placeholder={providerMeta.defaultModel}
                />
              )}
              <p className="text-xs text-muted-foreground">
                {hasApiKey
                  ? t("settings.aiAssistant.modelHint")
                  : t("settings.aiAssistant.modelHintNoKey")}
              </p>
              {visionWarning && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{visionWarning}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("settings.aiAssistant.systemPrompt")}</Label>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder={t("settings.aiAssistant.systemPromptPlaceholder")}
                maxLength={SYSTEM_PROMPT_MAX_LENGTH}
                rows={4}
              />
              <div className="flex items-center justify-between gap-3 text-xs">
                <p
                  className={
                    isSystemPromptNearLimit
                      ? "text-amber-600"
                      : "text-muted-foreground"
                  }
                >
                  {t("settings.aiAssistant.systemPromptHint", {
                    max: systemPromptLimitLabel,
                  })}
                </p>
                <span
                  className={
                    isSystemPromptNearLimit
                      ? "shrink-0 text-amber-600"
                      : "shrink-0 text-muted-foreground"
                  }
                >
                  {systemPromptLength.toLocaleString()} / {systemPromptLimitLabel}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={testing || saving || (!hasApiKey && !apiKey.trim())}
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <PlugZap className="w-4 h-4 mr-2" />
                )}
                {testing
                  ? t("settings.aiAssistant.testing")
                  : t("settings.aiAssistant.test")}
              </Button>
              <Button onClick={handleSave} disabled={saving || testing}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("common.save")}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
