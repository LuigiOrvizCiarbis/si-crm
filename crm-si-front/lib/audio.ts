import type { SyntheticEvent } from "react"

/**
 * Pausa cualquier otro <audio> de la página cuando uno empieza a reproducirse,
 * para que nunca suenen dos audios en simultáneo.
 */
export function pauseOtherAudios(e: SyntheticEvent<HTMLAudioElement>) {
  document.querySelectorAll("audio").forEach((el) => {
    if (el !== e.currentTarget && !el.paused) el.pause()
  })
}
