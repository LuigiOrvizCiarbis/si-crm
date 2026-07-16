import type { UserTenant } from "@/store/useAuthStore"

/**
 * Un tenant sin plan asignado se trata como "free", igual que el backend
 * (Tenant::planKey() en app/Models/Tenant.php).
 */
function planKey(tenant?: UserTenant | null): string {
  return tenant?.plan?.key ?? "free"
}

export function isTrialExpired(tenant?: UserTenant | null): boolean {
  if (!tenant?.trial_ends_at || planKey(tenant) !== "free") {
    return false
  }
  return new Date(tenant.trial_ends_at).getTime() < Date.now()
}

export function isOnTrial(tenant?: UserTenant | null): boolean {
  if (!tenant?.trial_ends_at || planKey(tenant) !== "free") {
    return false
  }
  return new Date(tenant.trial_ends_at).getTime() > Date.now()
}

export function trialDaysLeft(tenant?: UserTenant | null): number | null {
  if (!isOnTrial(tenant)) {
    return null
  }
  const diffMs = new Date(tenant!.trial_ends_at!).getTime() - Date.now()
  return Math.max(0, Math.ceil(diffMs / 86400000))
}
