export interface SlashCommandMatch {
  query: string
  start: number
  end: number
}

export interface HotkeyExpansionContext {
  contactName?: string | null
  userName?: string | null
  tenantName?: string | null
}

const SLASH_BODY = /[a-zA-Z0-9_-]/

/**
 * Detect a `/command` token under the cursor.
 *
 * The slash must be at the start of the value or preceded by whitespace.
 * Returns the lowercase query, plus the start/end indexes (inclusive of `/`,
 * exclusive of `end`) so callers can replace `value.slice(start, end)`.
 */
export function parseSlashCommand(value: string, cursorPos: number): SlashCommandMatch | null {
  if (cursorPos < 1) return null

  let start = cursorPos - 1
  while (start >= 0 && value[start] !== "/" && SLASH_BODY.test(value[start]!)) {
    start--
  }

  if (start < 0 || value[start] !== "/") return null

  const prev = start === 0 ? "" : value[start - 1]
  if (prev !== "" && !/\s/.test(prev)) return null

  let end = cursorPos
  while (end < value.length && SLASH_BODY.test(value[end]!)) {
    end++
  }

  const query = value.slice(start + 1, end).toLowerCase()
  return { query, start, end }
}

/**
 * Replace template variables `{{name}}` with values from the context.
 * Unknown variables collapse to an empty string.
 */
export function expandHotkey(content: string, ctx: HotkeyExpansionContext): string {
  const map: Record<string, string> = {
    contact_name: ctx.contactName ?? "",
    user_name: ctx.userName ?? "",
    tenant_name: ctx.tenantName ?? "",
  }

  return content.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : ""
  })
}
