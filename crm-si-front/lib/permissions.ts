import type { UserRole } from "@/store/useAuthStore"

type Translator = (key: string, params?: Record<string, string | number>) => string

export function formatPermission(perm: string, t: Translator): string {
  const key = `roles.perms.${perm}`
  const label = t(key)
  return label === key ? perm : label
}

export function formatPermissionGroup(resource: string, t: Translator): string {
  const key = `roles.groups.${resource}`
  const label = t(key)
  return label === key ? resource : label
}

export function hasPermission(perm: string, permissions: string[] | undefined | null): boolean {
  if (!permissions) {
    return false
  }
  return permissions.includes(perm)
}

export function hasAnyPermission(perms: string[], permissions: string[] | undefined | null): boolean {
  if (!permissions || permissions.length === 0) {
    return false
  }
  return perms.some((p) => permissions.includes(p))
}

export function hasAllPermissions(perms: string[], permissions: string[] | undefined | null): boolean {
  if (!permissions || permissions.length === 0) {
    return false
  }
  return perms.every((p) => permissions.includes(p))
}

export function isOwner(role: UserRole | null | undefined): boolean {
  return role?.is_owner === true
}

export function isAdminRole(
  role: UserRole | null | undefined,
  permissions?: string[] | null
): boolean {
  if (isOwner(role)) {
    return true
  }
  // Without the Owner flag we can't reliably detect renamed Admin roles by name.
  // Fall back to the canonical Admin permission set, identified by roles.manage
  // being absent (Admin) while users.view is present.
  if (!permissions) {
    return role?.name === "Admin"
  }
  return permissions.includes("users.view") && permissions.includes("invitations.create")
}
