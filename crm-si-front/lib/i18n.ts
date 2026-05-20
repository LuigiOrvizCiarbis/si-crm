import es from "@/locales/es.json"
import en from "@/locales/en.json"

export type Language = "es" | "en"

const resources = { es, en }

function getNestedValue(obj: Record<string, any>, key: string): string {
  // Direct hit (allows keys that contain dots, e.g. "conversations.view_any").
  if (typeof obj[key] === "string") {
    return obj[key]
  }

  // Greedy match: walk the dotted path but, at each step, also try the rest of
  // the key as a literal lookup on the current object. This lets us mix nested
  // groups with leaf keys that themselves contain dots.
  const parts = key.split(".")
  let current: any = obj
  for (let i = 0; i < parts.length; i++) {
    if (current == null || typeof current !== "object") return key
    const remainder = parts.slice(i).join(".")
    if (typeof current[remainder] === "string") {
      return current[remainder]
    }
    current = current[parts[i]]
  }
  return typeof current === "string" ? current : key
}

function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => {
    return name in params ? String(params[name]) : `{{${name}}}`
  })
}

export function getTranslator(lang: Language) {
  const data = resources[lang] as typeof es
  return function t(key: string, params?: Record<string, string | number>): string {
    const value = getNestedValue(data as Record<string, any>, key)
    if (params && typeof value === "string") {
      return interpolate(value, params)
    }
    return value
  }
}
