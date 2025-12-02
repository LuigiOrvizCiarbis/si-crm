"use client"

import { useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"

interface AutosaveOptions {
  onSave: (data: any) => Promise<void>
  debounceMs?: number
  showToast?: boolean
}

export function useAutosave({ onSave, debounceMs = 600, showToast = true }: AutosaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingSaveRef = useRef<any>(null)

  const save = useCallback(
    async (data: any, immediate = false) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      pendingSaveRef.current = data

      const executeSave = async () => {
        try {
          await onSave(pendingSaveRef.current)
          if (showToast) {
            toast.success("Cambios guardados", {
              duration: 2000,
            })
          }
          pendingSaveRef.current = null
        } catch (error) {
          if (showToast) {
            toast.error("No se pudo guardar, reintentá", {
              duration: 3000,
              action: {
                label: "Reintentar",
                onClick: () => save(pendingSaveRef.current, true),
              },
            })
          }
          console.error("[v0] Autosave error:", error)
        }
      }

      if (immediate) {
        await executeSave()
      } else {
        timeoutRef.current = setTimeout(executeSave, debounceMs)
      }
    },
    [onSave, debounceMs, showToast],
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { save }
}
