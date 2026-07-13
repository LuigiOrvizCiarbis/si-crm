"use client"

import { useEffect } from "react"

/**
 * Callback del OAuth de Instagram (Facebook Login vía popup).
 * Meta redirige acá con ?code=... (o ?error=...). Le pasamos el resultado a la
 * ventana que abrió el popup (el hook useInstagramLogin escucha el message) y
 * cerramos. Nota: Meta puede appendear `#_` al final de la URL — es un fragment,
 * no afecta los query params.
 */
export default function InstagramCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (window.opener) {
      window.opener.postMessage(
        {
          type: "instagram-auth",
          code: params.get("code"),
          error: params.get("error"),
          state: params.get("state"),
        },
        window.location.origin,
      )
    }

    window.close()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">
        Conectando Instagram… podés cerrar esta ventana.
      </p>
    </div>
  )
}
