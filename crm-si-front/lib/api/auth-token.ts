export function getAuthToken(): string | null {
  const authStorage = localStorage.getItem("auth-storage");
  if (!authStorage) return null;
  try {
    return JSON.parse(authStorage)?.state?.token ?? null;
  } catch {
    return null;
  }
}
