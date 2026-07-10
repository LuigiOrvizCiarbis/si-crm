import { TemplateComponent } from "@/data/types"

function findComponent(components: TemplateComponent[], type: string): TemplateComponent | undefined {
  return components.find((c) => c.type?.toUpperCase() === type)
}

/**
 * Cantidad de parámetros {{n}} del BODY, dimensionada por el ÍNDICE MÁXIMO
 * encontrado (no por cantidad de ocurrencias: un {{2}} sin {{1}} requiere 2 params).
 */
export function extractBodyParamCount(components: TemplateComponent[]): number {
  const body = findComponent(components, "BODY")
  if (!body?.text) return 0
  const matches = body.text.match(/\{\{(\d+)\}\}/g)
  if (!matches) return 0
  return Math.max(...matches.map((m) => parseInt(m.replace(/\D/g, ""), 10)))
}

/**
 * Preview del BODY con los valores reemplazados globalmente
 * (todas las ocurrencias de cada {{n}}, no solo la primera).
 */
export function buildTemplatePreview(components: TemplateComponent[], paramValues: string[]): string {
  const body = findComponent(components, "BODY")
  if (!body?.text) return ""
  let text = body.text
  paramValues.forEach((val, i) => {
    text = text.replaceAll(`{{${i + 1}}}`, val || `{{${i + 1}}}`)
  })
  return text
}

/**
 * v1 de difusión: solo se soportan plantillas cuyos parámetros dinámicos
 * están en el BODY (texto). HEADER con placeholders o media, y botones con
 * URL dinámica, requieren components que el diálogo aún no arma.
 */
export function hasUnsupportedParams(components: TemplateComponent[]): boolean {
  const header = findComponent(components, "HEADER")
  if (header) {
    const format = header.format?.toUpperCase()
    if (format && format !== "TEXT") return true // media header (IMAGE/VIDEO/DOCUMENT/LOCATION)
    if (header.text && /\{\{\d+\}\}/.test(header.text)) return true // header con placeholder
  }

  const buttons = findComponent(components, "BUTTONS")
  if (buttons?.buttons?.some((b) => b.url && /\{\{\d+\}\}/.test(b.url))) return true // URL dinámica

  return false
}
