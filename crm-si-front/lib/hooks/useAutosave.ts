"use client"

import { useCallback, useEffect, useRef } from "react"
import { useToast } from "@/components/Toast"

interface AutosaveOptions<T> {
  onSave: (data: T) => Promise<void>
  onError?: (data: T, error: unknown) => void
  debounceMs?: number
  showToast?: boolean
}

export function useAutosave<T>({ onSave, onError, debounceMs = 600, showToast = true }: AutosaveOptions<T>) {
  const { addToast } = useToast()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingSaveRef = useRef<T | null>(null)

  const save = useCallback(
    async (data: T, immediate = false) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      pendingSaveRef.current = data

      const executeSave = async (): Promise<void> => {
        const payload = pendingSaveRef.current
        if (payload === null) return
        try {
          await onSave(payload)
          if (showToast) {
            addToast({ type: "success", title: "Cambios guardados" })
          }
          if (pendingSaveRef.current === payload) {
            pendingSaveRef.current = null
          }
        } catch (error) {
          if (showToast) {
            addToast({
              type: "error",
              title: "No se pudo guardar",
              description: error instanceof Error ? error.message : "Reintentá en unos segundos",
            })
          }
          onError?.(payload, error)
          if (pendingSaveRef.current === payload) {
            pendingSaveRef.current = null
          }
          console.error("[autosave] error:", error)
        }
      }

      if (immediate) {
        await executeSave()
      } else {
        timeoutRef.current = setTimeout(executeSave, debounceMs)
      }
    },
    [onSave, debounceMs, showToast, addToast],
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
