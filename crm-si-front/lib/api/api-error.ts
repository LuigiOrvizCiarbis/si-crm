import * as Sentry from "@sentry/nextjs";

const GENERIC_ERROR = "Ocurrió un error inesperado. Inténtalo de nuevo más tarde.";

function sanitizeApiPayload(payload: any) {
  return {
    message: typeof payload?.message === "string" ? payload.message : undefined,
    error: typeof payload?.error === "string" ? payload.error : undefined,
    code: typeof payload?.code === "string" || typeof payload?.code === "number" ? payload.code : undefined,
  };
}

function reportApiError(status: number, payload: any, fallback?: string) {
  Sentry.captureMessage("api_request_failed", {
    level: status >= 500 ? "error" : "warning",
    tags: {
      feature: "api",
      http_status: String(status),
    },
    extra: {
      fallback,
      apiError: sanitizeApiPayload(payload),
      page:
        typeof window !== "undefined"
          ? {
              path: window.location.pathname,
              search: window.location.search,
            }
          : undefined,
    },
  });
}

/**
 * Lanza un error con mensaje sanitizado según el status HTTP.
 * - 4xx: usa el mensaje del backend (errores de validación, auth, etc.)
 * - 5xx: muestra un mensaje genérico al usuario
 */
export function throwApiError(status: number, payload: any, fallback?: string): never {
  reportApiError(status, payload, fallback);

  if (status >= 400 && status < 500) {
    throw new Error(payload?.message || fallback || GENERIC_ERROR);
  }

  // 5xx o cualquier otro: mensaje genérico
  throw new Error(GENERIC_ERROR);
}
