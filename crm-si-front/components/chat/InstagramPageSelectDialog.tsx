"use client"

import { Instagram } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { InstagramPageOption } from "@/hooks/useInstagramLogin"

interface InstagramPageSelectDialogProps {
  /** Lista de páginas a elegir. Si es null, el diálogo está cerrado. */
  pages: InstagramPageOption[] | null
  onSelect: (pageId: string) => void
  onCancel: () => void
}

/**
 * Diálogo de selección de página de Facebook cuando el usuario tiene más de una
 * con Instagram vinculado. Aparece en la segunda vuelta del onboarding.
 */
export function InstagramPageSelectDialog({
  pages,
  onSelect,
  onCancel,
}: InstagramPageSelectDialogProps) {
  const open = pages !== null && pages.length > 0

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Elegí una cuenta de Instagram</DialogTitle>
          <DialogDescription>
            Tenés varias páginas de Facebook con Instagram vinculado. Seleccioná
            cuál querés conectar como canal.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {(pages ?? []).map((page) => (
            <button
              key={page.page_id}
              type="button"
              onClick={() => onSelect(page.page_id)}
              className="flex items-center gap-3 rounded-md border border-border p-3 text-left transition-colors hover:bg-muted/60"
            >
              <Instagram className="h-5 w-5 shrink-0 text-pink-600" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {page.username ? `@${page.username}` : page.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">{page.name}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
