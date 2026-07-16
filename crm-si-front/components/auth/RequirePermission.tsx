"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { usePermission } from "@/hooks/usePermission"

interface RequirePermissionProps {
  perm: string | string[]
  redirectTo?: string
  children: ReactNode
}

export function RequirePermission({ perm, redirectTo = "/chats", children }: RequirePermissionProps) {
  const router = useRouter()
  const allowed = usePermission(perm)
  const hydrated = useAuthStore((s) => s._hasHydrated)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (hydrated && isAuthenticated && !allowed) {
      router.replace(redirectTo)
    }
  }, [hydrated, isAuthenticated, allowed, redirectTo, router])

  if (!hydrated) {
    return null
  }

  if (!allowed) {
    return null
  }

  return <>{children}</>
}
