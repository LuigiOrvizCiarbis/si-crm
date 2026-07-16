"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarClock, ExternalLink, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import type { TaskCalendarSyncInfo } from "@/lib/types/task"
import { retryTaskCalendarSync } from "@/lib/api/google-calendar"

const STATUS_STYLES: Record<TaskCalendarSyncInfo["status"], string> = {
  synced: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-transparent",
  pending: "bg-muted text-muted-foreground border-transparent",
  error: "bg-destructive/15 text-destructive border-transparent",
  paused: "bg-muted text-muted-foreground border-transparent",
}

const STATUS_LABELS: Record<TaskCalendarSyncInfo["status"], string> = {
  synced: "Sincronizada",
  pending: "Pendiente de sincronizar",
  error: "Error al sincronizar",
  paused: "Sincronización pausada",
}

interface CalendarSyncBadgeProps {
  taskId: string
  sync?: TaskCalendarSyncInfo | null
  onRetried?: () => void
}

export function CalendarSyncBadge({ taskId, sync, onRetried }: CalendarSyncBadgeProps) {
  const [retrying, setRetrying] = useState(false)

  if (!sync) return null

  const handleRetry = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setRetrying(true)
    const result = await retryTaskCalendarSync(taskId)
    setRetrying(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Reintento encolado")
    onRetried?.()
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge
        variant="outline"
        className={`gap-1 text-xs font-medium ${STATUS_STYLES[sync.status]}`}
        title={sync.lastError ?? undefined}
      >
        <CalendarClock className="size-3" />
        {STATUS_LABELS[sync.status]}
      </Badge>

      {sync.meetLink && (
        <a
          href={sync.meetLink}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <ExternalLink className="size-3" />
          Unirse con Google Meet
        </a>
      )}

      {sync.status === "error" && (
        <Button
          size="sm"
          variant="ghost"
          className="h-6 gap-1 px-1.5 text-xs"
          onClick={handleRetry}
          disabled={retrying}
        >
          {retrying ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
          Reintentar
        </Button>
      )}
    </div>
  )
}
