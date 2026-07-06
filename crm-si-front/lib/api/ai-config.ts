import { getAuthToken } from "./auth-token"

export type AiProviderId = "claude" | "openai"

export interface AiConfig {
  provider: AiProviderId | null
  model: string | null
  enabled: boolean
  system_prompt: string | null
  has_api_key: boolean
}

export interface AiConfigInput {
  provider: AiProviderId
  model?: string | null
  enabled: boolean
  system_prompt?: string | null
  // Write-only: solo se manda si el usuario cargó una nueva key.
  api_key?: string
}

export async function getAiConfig(): Promise<AiConfig | null> {
  const token = getAuthToken()
  if (!token) return null

  const res = await fetch("/api/ai-config", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  })

  if (!res.ok) return null
  const json = await res.json()
  return json.data ?? null
}

/**
 * Trae los modelos disponibles para el proveedor + key ya guardados del tenant.
 * Devuelve [] si no hay key cargada o si el proveedor no responde.
 */
export async function getAiModels(): Promise<string[]> {
  const token = getAuthToken()
  if (!token) return []

  const res = await fetch("/api/ai-config/models", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  })

  if (!res.ok) return []
  const json = await res.json().catch(() => ({}))
  return Array.isArray(json.data) ? json.data : []
}

export async function updateAiConfig(
  input: AiConfigInput,
): Promise<{ data?: AiConfig; error?: string }> {
  const token = getAuthToken()
  if (!token) return { error: "No auth" }

  const res = await fetch("/api/ai-config", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) return { error: extractError(json) }
  return { data: json.data }
}

function extractError(json: any): string {
  if (json?.errors && typeof json.errors === "object") {
    const first = Object.values(json.errors)[0]
    if (Array.isArray(first) && first.length > 0) return String(first[0])
  }
  return json?.message || "Error"
}
