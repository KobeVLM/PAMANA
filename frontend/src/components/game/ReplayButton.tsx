import { Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ReplayButtonProps {
  /** Starts playback synchronously so the tap feels instant. */
  onReplay: () => void
  /** Highlights the button while its clip is speaking. */
  isSpeaking?: boolean
  label?: string
  labelEn?: string
  className?: string
}

/**
 * Oversized, high-contrast "Makinig Ulit" control (minimum 56 px) used at the
 * top of every activity. The gentle pulse invites a second tap without
 * hiding the label; reduced-motion users get a still button via CSS.
 */
export function ReplayButton({
  onReplay,
  isSpeaking = false,
  label = "Makinig Ulit",
  labelEn = "Listen Again",
  className,
}: ReplayButtonProps) {
  return (
    <button
      type="button"
      onClick={onReplay}
      aria-label={`${label} / ${labelEn}`}
      data-speaking={isSpeaking ? "true" : undefined}
      className={cn(
        "animate-replay-pulse inline-flex min-h-[56px] min-w-[56px] items-center justify-center gap-2 rounded-full border-[3px] border-[#8A4B08] bg-gradient-to-b from-[#FFD36E] to-[#F6B333] px-5 py-2 font-heading text-base font-black text-[#3B240F] shadow-[0_5px_0_#8A4B08] transition-transform hover:scale-105 active:translate-y-0.5 active:shadow-none",
        isSpeaking && "ring-4 ring-white/90",
        className
      )}
    >
      <Volume2 className="h-6 w-6 shrink-0" strokeWidth={3} aria-hidden="true" />
      <span className="whitespace-nowrap">{label}</span>
      <span className="hidden whitespace-nowrap text-xs font-bold opacity-80 sm:inline">
        / {labelEn}
      </span>
    </button>
  )
}
