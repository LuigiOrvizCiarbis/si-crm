"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertTriangle, X, Mail } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { Button } from "@/components/ui/button"

export function EmailVerificationBanner() {
  const { isAuthenticated, emailVerified } = useAuthStore()
  const [isDismissed, setIsDismissed] = useState(false)

  // No mostrar si no está autenticado, ya verificó, o fue cerrado
  if (!isAuthenticated || emailVerified || isDismissed) {
    return null
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>Tu email no está verificado.</strong>{" "}
            <span className="hidden sm:inline">
              Revisa tu bandeja de entrada o{" "}
            </span>
            <Link 
              href="/verify-email" 
              className="underline hover:no-underline font-medium"
            >
              solicita un nuevo email
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/verify-email">
            <Button size="sm" variant="outline" className="hidden sm:flex gap-2 border-amber-500/30 hover:bg-amber-500/10">
              <Mail className="w-4 h-4" />
              Verificar
            </Button>
          </Link>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 transition-colors"
            aria-label="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
