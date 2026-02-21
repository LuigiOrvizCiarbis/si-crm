import es from "@/locales/es.json"
import en from "@/locales/en.json"

export type Language = "es" | "en"

const resources = { es, en }

function getNestedValue(obj: Record<string, any>, key: string): string {
  const parts = key.split(".")
  let current: any = obj
  for (const part of parts) {
    if (current == null) return key
    current = current[part]
  }
  return typeof current === "string" ? current : key
}

export function getTranslator(lang: Language) {
  const data = resources[lang] as typeof es
  return function t(key: string): string {
    return getNestedValue(data as Record<string, any>, key)
  }
}
