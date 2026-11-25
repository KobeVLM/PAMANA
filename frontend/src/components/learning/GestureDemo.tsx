import { useEffect, useRef } from "react"
import { Hand } from "lucide-react"
import type { Bi } from "@/lib/i18n"
import { useReducedMotionSafe } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { GESTURE_DEMO_MS } from "@/lib/scaffolding"

export interface GestureDemoProps {
  /** What the hand is demonstrating, e.g. "Tap the matching card". */
  label: Bi
  /** Called once the demo ends (or is skipped) so play can begin. */
  onComplete: () => void
  durationMs?: number
  className?: string
}

/**
 * Two-second animated hand-cursor demonstration shown before a new game
 * mechanic becomes interactive. It is a status message for screen readers and
 * never traps focus; callers disable the answer controls while it is visible.
 */
export function GestureDemo({
  label,
  onComplete,
  durationMs = GESTURE_DEMO_MS,
  className,
}: GestureDemoProps) {
  const reduceMotion = useReducedMotionSafe()
  const completed = useRef(false)

  const finish = () => {
    if (completed.current) return
    completed.current = true
    onComplete()
  }

  useEffect(() => {
    const timer = window.setTimeout(finish, durationMs)
    return () => window.clearTimeout(timer)
    // `finish` is stable in practice; the ref guard handles repeated calls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMs, onComplete])

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 rounded-3xl bg-white/45 backdrop-blur-[1px]",
        className
      )}
    >
      <Hand
        aria-hidden="true"
        className={cn(
          "h-12 w-12 -rotate-12 text-[#2d5e3e] drop-shadow-lg",
          !reduceMotion && "animate-gesture-point"
        )}
      />
      <p className="rounded-xl border-2 border-[#a4cba9] bg-white/95 px-4 py-2 text-center font-heading text-sm font-black text-[#1B5E20] shadow-md md:text-base">
        {label.fil}
        <span className="mt-0.5 block text-xs font-bold text-[#3f7d52] md:text-sm">
          {label.en}
        </span>
      </p>
      <button
        type="button"
        onClick={finish}
        className="pointer-events-auto rounded-full border-2 border-[#a4cba9] bg-white/95 px-3 py-1 text-xs font-bold text-[#2b5c3b] hover:bg-white"
      >
        Skip / Laktawan
      </button>
    </div>
  )
}
