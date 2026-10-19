import * as React from "react"
import { useReducedMotionSafe } from "@/lib/motion"

export type CelebrationIntensity = "small" | "medium" | "large"

type ConfettiFn = typeof import("canvas-confetti")

const COLORS = ["#F59E0B", "#2D7D46", "#FFFBEB", "#C2410C", "#4ADE80"]

/**
 * Fire a confetti celebration. Lazy-loads canvas-confetti on first use and
 * does nothing when the user prefers reduced motion.
 *
 *   const celebrate = useCelebration()
 *   ...
 *   celebrate("large") // on module completion
 */
export function useCelebration() {
  const reduceMotion = useReducedMotionSafe()
  const confettiRef = React.useRef<ConfettiFn | null>(null)

  const fire = React.useCallback(
    async (intensity: CelebrationIntensity = "medium") => {
      if (reduceMotion) return

      if (!confettiRef.current) {
        const mod = await import("canvas-confetti")
        confettiRef.current = mod.default
      }
      const confetti = confettiRef.current
      if (!confetti) return

      const base = {
        colors: COLORS,
        disableForReducedMotion: true,
      }

      if (intensity === "small") {
        confetti({ ...base, particleCount: 45, spread: 65, origin: { y: 0.7 } })
        return
      }

      if (intensity === "medium") {
        confetti({ ...base, particleCount: 80, spread: 80, origin: { y: 0.65 } })
        window.setTimeout(
          () => confetti({ ...base, particleCount: 60, spread: 100, origin: { y: 0.6 } }),
          220
        )
        return
      }

      confetti({
        ...base,
        particleCount: 120,
        spread: 100,
        startVelocity: 42,
        origin: { y: 0.6 },
      })
      window.setTimeout(
        () =>
          confetti({ ...base, particleCount: 70, angle: 60, spread: 70, origin: { x: 0, y: 0.7 } }),
        180
      )
      window.setTimeout(
        () =>
          confetti({ ...base, particleCount: 70, angle: 120, spread: 70, origin: { x: 1, y: 0.7 } }),
        320
      )
    },
    [reduceMotion]
  )

  return fire
}

export interface CelebrationProps {
  /** Fire whenever this value changes to a truthy value. */
  trigger: unknown
  intensity?: CelebrationIntensity
}

/**
 * Declarative wrapper around useCelebration for one-off completion screens.
 */
export function Celebration({ trigger, intensity = "medium" }: CelebrationProps) {
  const celebrate = useCelebration()
  const hasFired = React.useRef(false)

  React.useEffect(() => {
    if (!trigger) {
      hasFired.current = false
      return
    }
    if (hasFired.current) return
    hasFired.current = true
    void celebrate(intensity)
  }, [trigger, intensity, celebrate])

  return null
}
