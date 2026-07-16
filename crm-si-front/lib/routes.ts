export const publicRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/pricing",
  "/email-verified",
  "/verify-email/confirm",
  "/privacy-policy",
  "/terms",
  "/data-deletion",
  "/invitation",
]

export const authOnlyRoutes = ["/login", "/register", "/forgot-password", "/reset-password"]

export const unverifiedAllowedRoutes = [
  "/verify-email",
  "/email-verified",
  "/pricing",
  "/verify-email/confirm",
]

export const trialExpiredAllowedRoutes = ["/trial-expired", "/pricing"]

export const routesWithoutAppShell = [
  ...publicRoutes,
  "/verify-email",
  "/trial-expired",
]

export function isRouteMatch(pathname: string, routes: string[]) {
  return routes.some((route) => pathname.startsWith(route))
}
