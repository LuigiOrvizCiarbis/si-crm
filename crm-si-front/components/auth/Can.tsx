"use client"

import type { ReactNode } from "react"
import { usePermission } from "@/hooks/usePermission"

interface CanProps {
  perm: string | string[]
  fallback?: ReactNode
  children: ReactNode
}

export function Can({ perm, fallback = null, children }: CanProps) {
  const allowed = usePermission(perm)
  if (!allowed) {
    return <>{fallback}</>
  }
  return <>{children}</>
}
