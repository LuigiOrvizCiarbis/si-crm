"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Loader2, Plus, TagIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/components/Toast"
import { attachContactTags, attachConversationTags, createTag, detachContactTag, detachConversationTag, getTags, type Tag } from "@/lib/api/tags"
import { cn } from "@/lib/utils"
import { TagChips } from "./TagChips"

type TagTarget = "contact" | "conversation"

interface TagPickerProps {
  target: TagTarget
  targetId: number
  value?: Tag[]
  onChange?: (tags: Tag[]) => void
  buttonLabel?: string
  compact?: boolean
  className?: string
}

const DEFAULT_COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"]

export function TagPicker({
  target,
  targetId,
  value = [],
  onChange,
  buttonLabel = "Etiquetas",
  compact = false,
  className,
}: TagPickerProps) {
  const { addToast } = useToast()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)

  const selectedIds = useMemo(() => new Set(value.map((tag) => tag.id)), [value])
  const normalizedQuery = query.trim().toLowerCase()
  const filteredTags = tags.filter((tag) => tag.name.toLowerCase().includes(normalizedQuery))
  const canCreate = normalizedQuery.length > 0 && !tags.some((tag) => tag.name.toLowerCase() === normalizedQuery)

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoading(true)
    getTags()
      .then((loadedTags) => {
        if (!cancelled) setTags(loadedTags)
      })
      .catch((error) => {
        addToast({
          type: "error",
          title: "No se pudieron cargar las etiquetas",
          description: error instanceof Error ? error.message : "Error desconocido",
        })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, addToast])

  const attachTag = async (tag: Tag) => {
    if (selectedIds.has(tag.id)) return

    setSavingId(tag.id)
    try {
      if (target === "contact") {
        await attachContactTags(targetId, [tag.id])
      } else {
        await attachConversationTags(targetId, [tag.id])
      }
      onChange?.([...value, tag].sort((a, b) => a.name.localeCompare(b.name)))
    } catch (error) {
      addToast({
        type: "error",
        title: "No se pudo asignar la etiqueta",
        description: error instanceof Error ? error.message : "Error desconocido",
      })
    } finally {
      setSavingId(null)
    }
  }

  const removeTag = async (tag: Tag) => {
    setSavingId(tag.id)
    try {
      if (target === "contact") {
        await detachContactTag(targetId, tag.id)
      } else {
        await detachConversationTag(targetId, tag.id)
      }
      onChange?.(value.filter((selectedTag) => selectedTag.id !== tag.id))
    } catch (error) {
      addToast({
        type: "error",
        title: "No se pudo quitar la etiqueta",
        description: error instanceof Error ? error.message : "Error desconocido",
      })
    } finally {
      setSavingId(null)
    }
  }

  const handleCreate = async () => {
    const name = query.trim()
    if (!name) return

    setCreating(true)
    try {
      const color = DEFAULT_COLORS[tags.length % DEFAULT_COLORS.length]
      const tag = await createTag({ name, color })
      setTags((current) => [...current, tag].sort((a, b) => a.name.localeCompare(b.name)))
      setQuery("")
      await attachTag(tag)
    } catch (error) {
      addToast({
        type: "error",
        title: "No se pudo crear la etiqueta",
        description: error instanceof Error ? error.message : "Error desconocido",
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {!compact && (
        <TagChips tags={value} removable onRemove={removeTag} emptyLabel="Sin etiquetas" />
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("h-8 gap-2 bg-transparent", compact && "h-7 px-2 text-xs")}
          >
            <TagIcon className="h-3.5 w-3.5" />
            {buttonLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-0" sideOffset={8}>
          <div className="border-b p-3">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar o crear etiqueta"
              className="h-9"
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center gap-2 px-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando etiquetas
              </div>
            ) : (
              <>
                {filteredTags.map((tag) => {
                  const selected = selectedIds.has(tag.id)
                  const saving = savingId === tag.id
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-accent disabled:cursor-wait disabled:opacity-60"
                      disabled={saving}
                      onClick={() => (selected ? removeTag(tag) : attachTag(tag))}
                    >
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span className="min-w-0 flex-1 truncate">{tag.name}</span>
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : selected ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : null}
                    </button>
                  )
                })}
                {canCreate && (
                  <button
                    type="button"
                    className="mt-1 flex w-full items-center gap-3 rounded-md border border-dashed px-2 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:cursor-wait disabled:opacity-60"
                    disabled={creating}
                    onClick={handleCreate}
                  >
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Crear "{query.trim()}"
                  </button>
                )}
                {!filteredTags.length && !canCreate && (
                  <div className="px-2 py-6 text-sm text-muted-foreground">No hay etiquetas.</div>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
