const GENERIC_ERROR = "Ocurrió un error inesperado. Inténtalo de nuevo más tarde.";

/**
 * Lanza un error con mensaje sanitizado según el status HTTP.
 * - 4xx: usa el mensaje del backend (errores de validación, auth, etc.)
 * - 5xx: muestra un mensaje genérico al usuario
 */
export function throwApiError(status: number, payload: any, fallback?: string): never {
  if (status >= 400 && status < 500) {
    throw new Error(payload?.message || fallback || GENERIC_ERROR);
  }

  // 5xx o cualquier otro: mensaje genérico
  throw new Error(GENERIC_ERROR);
}
