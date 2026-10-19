import { useCallback, useEffect, useRef } from "react"

/**
 * Preloads a single audio URL and exposes replay(). Safely no-ops when the
 * URL is missing or audio is unavailable (e.g. in tests/SSR).
 * Pass `volume` (0–1) to soften the clip.
 */
export function useAudioElement(url?: string | null, volume?: number) {
  const ref = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!url || typeof Audio === "undefined") {
      ref.current = null
      return
    }

    const audio = new Audio(url)
    audio.preload = "auto"
    if (volume !== undefined) {
      audio.volume = Math.min(1, Math.max(0, volume))
    }
    ref.current = audio

    return () => {
      audio.pause()
      ref.current = null
    }
  }, [url, volume])

  const replay = useCallback(() => {
    const audio = ref.current
    if (!audio) return
    audio.currentTime = 0
    void audio.play().catch(() => {
      // Autoplay may be blocked; the visual UI already conveys the state.
    })
  }, [])

  return { replay }
}

/**
 * Shared sound effects for gameplay feedback.
 * The wrong-answer cue is intentionally soft so mistakes feel gentle.
 */
export function useSfx() {
  const wrong = useAudioElement("/audio/sfx/wrong.mp3", 0.35)

  return { playWrong: wrong.replay }
}
