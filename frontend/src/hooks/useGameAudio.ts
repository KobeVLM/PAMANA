import { useCallback } from "react"
import { useAudio } from "@/contexts/AudioContext"

/**
 * Plays a single clip through the shared voice channel. Any other clip
 * (instruction, word, effect) is stopped first, so nothing overlaps.
 * Safely no-ops when the URL is missing or audio is unavailable.
 * Pass `volume` (0–1) to soften the clip.
 */
export function useAudioElement(url?: string | null, volume?: number) {
  const { playAudio } = useAudio()

  const replay = useCallback(() => {
    if (!url) return
    void playAudio(url, { volume })
  }, [url, volume, playAudio])

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
