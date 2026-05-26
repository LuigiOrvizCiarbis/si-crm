import { useAuthStore } from "@/store/useAuthStore"
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isAdminRole,
  isOwner,
} from "@/lib/permissions"

export function usePermission(perm: string | string[]): boolean {
  const permissions = useAuthStore((s) => s.permissions)
  if (Array.isArray(perm)) {
    return hasAnyPermission(perm, permissions)
  }
  return hasPermission(perm, permissions)
}

export function useAllPermissions(perms: string[]): boolean {
  const permissions = useAuthStore((s) => s.permissions)
  return hasAllPermissions(perms, permissions)
}

export function useIsOwner(): boolean {
  const role = useAuthStore((s) => s.role)
  return isOwner(role)
}

export function useIsAdmin(): boolean {
  const role = useAuthStore((s) => s.role)
  const permissions = useAuthStore((s) => s.permissions)
  return isAdminRole(role, permissions)
}
