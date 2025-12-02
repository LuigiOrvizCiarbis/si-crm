"use client"

import { useState, useEffect } from "react"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Toast {
  id: string
  type: "success" | "error" | "info"
  title: string
  description?: string
  duration?: number
}

interface ToastProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastComponent({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, toast.duration || 5000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  }

  const Icon = icons[toast.type]

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-sm animate-in slide-in-from-right-full",
        toast.type === "success" &&
          "bg-green-50/90 border-green-200 text-green-800 dark:bg-green-950/90 dark:border-green-800 dark:text-green-200",
        toast.type === "error" &&
          "bg-red-50/90 border-red-200 text-red-800 dark:bg-red-950/90 dark:border-red-800 dark:text-red-200",
        toast.type === "info" &&
          "bg-blue-50/90 border-blue-200 text-blue-800 dark:bg-blue-950/90 dark:border-blue-800 dark:text-blue-200",
      )}
    >
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{toast.title}</p>
        {toast.description && <p className="text-sm opacity-90 mt-1">{toast.description}</p>}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

let toastCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = `toast-${++toastCounter}`
    setToasts((prev) => [...prev, { ...toast, id }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )

  return { addToast, ToastContainer }
}
