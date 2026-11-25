import { cn } from "@/lib/utils"
import { StarMeter } from "./StarMeter"

/**
 * Shared HUD pieces for every gameplay screen.
 *
 * These are the presentational primitives behind Refactoring Priority #4: one
 * progress pill fed by {@link useAnswerProgress}, one step rail, and one
 * accuracy chip. Keeping them here means the answer-based progress rules and
 * the later instruction/feedback scaffolding only have to be built once.
 */

const clampPercent = (value: number) => {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

/**
 * Shared footprint for both HUD chips. Keeping these classes in one place means
 * the progress pill and the accuracy chip cannot drift apart visually.
 */
const HUD_CHIP_SIZES = {
  compact: {
    shell: "w-48 md:w-64 lg:w-80",
    track: "h-5 md:h-8",
    value: "ml-2 min-w-[3ch] text-lg md:ml-3 md:text-2xl",
  },
  wide: {
    shell: "w-64 md:w-[22rem] lg:w-[26rem]",
    track: "h-6 md:h-8",
    value: "ml-3 min-w-[3.5ch] text-xl md:text-2xl",
  },
} as const

export type HudChipSize = keyof typeof HUD_CHIP_SIZES

export interface ProgressPillProps {
  /** 0-100. Clamped, so a bad caller can never render past the pill. */
  value: number
  /** Shown instead of the percentage, e.g. "3/8" or "2/4". */
  label?: string
  /** `compact` matches the mastery screens, `wide` the module screens. */
  size?: HudChipSize
  className?: string
}

export function ProgressPill({ value, label, size = "compact", className }: ProgressPillProps) {
  const percent = clampPercent(value)
  const sizes = HUD_CHIP_SIZES[size]

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      aria-label={`Progreso (Progress): ${Math.round(percent)}%`}
      className={cn(
        "flex items-center rounded-full border-[4px] border-[#6A9C2C] bg-[#8CC63F] p-1.5 pr-5 shadow-[0_4px_6px_rgba(0,0,0,0.3)]",
        sizes.shell,
        className
      )}
    >
      <div
        className={cn(
          "relative flex-1 overflow-hidden rounded-full border-[3px] border-[#204D2B] bg-[#2F6A3E] shadow-[inset_0_3px_5px_rgba(0,0,0,0.6)]",
          sizes.track
        )}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full border-r-2 border-[#6A9C2C] bg-[#8CC63F] transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span
        className={cn(
          "text-right font-black tracking-wide text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]",
          sizes.value
        )}
      >
        {label ?? `${Math.round(percent)}%`}
      </span>
    </div>
  )
}

export interface PracticeStepItem {
  label: string
  state: "done" | "current" | "pending"
}

export interface PracticeStepRailProps {
  steps: PracticeStepItem[]
  size?: "compact" | "wide"
  className?: string
}

export function PracticeStepRail({ steps, size = "compact", className }: PracticeStepRailProps) {
  if (steps.length === 0) return null

  return (
    <div
      className={cn(
        "relative z-20 flex flex-wrap justify-center gap-2 px-4 md:gap-4",
        className
      )}
    >
      {steps.map((step) => (
        <div
          key={step.label}
          aria-current={step.state === "current" ? "step" : undefined}
          className={cn(
            "whitespace-nowrap rounded-full border-b-4 font-bold shadow-md transition-all",
            size === "wide"
              ? "px-5 py-2 text-sm md:px-7 md:py-2.5 md:text-base"
              : "px-4 py-1.5 text-xs md:px-6 md:py-2 md:text-sm",
            step.state === "current"
              ? "scale-105 border-amber-500 bg-amber-400 text-amber-950"
              : step.state === "done"
                ? "border-green-600 bg-green-500 text-white"
                : "border-gray-300 bg-gray-200 text-gray-600"
          )}
        >
          {step.label}
        </div>
      ))}
    </div>
  )
}

export interface AccuracyChipProps {
  /** 0-100, or null before the first answer. */
  accuracy: number | null
  label?: string
  labelEn?: string
  /** Matches the neighbouring ProgressPill footprint. */
  size?: HudChipSize
  className?: string
}

/**
 * The correctness number for the run, kept next to the progress bar so the two
 * quantities are never confused: the bar only moves forward, the accuracy can
 * reflect a wrong attempt, and the accuracy is the value the Parent Dashboard
 * reports for the same run. It shares the progress pill's shell and track size
 * so the two chips read as a matched pair.
 */
export function AccuracyChip({
  accuracy,
  label = "Katumpakan",
  labelEn = "Accuracy",
  size = "compact",
  className,
}: AccuracyChipProps) {
  const sizes = HUD_CHIP_SIZES[size]

  return (
    <div
      className={cn(
        "flex items-center rounded-full border-[4px] border-[#6A9C2C] bg-[#8CC63F] p-1.5 pr-5 shadow-[0_4px_6px_rgba(0,0,0,0.3)]",
        sizes.shell,
        className
      )}
      aria-label={`${label} (${labelEn})`}
    >
      <div
        className={cn(
          "relative flex flex-1 items-center gap-2 overflow-hidden rounded-full border-[3px] border-[#204D2B] bg-[#2F6A3E] px-2 shadow-[inset_0_3px_5px_rgba(0,0,0,0.6)]",
          sizes.track
        )}
      >
        <span className="hidden text-[10px] font-black uppercase tracking-wide text-white/90 sm:inline">
          {label}
        </span>
        <StarMeter accuracy={accuracy} size={size === "wide" ? "md" : "sm"} />
        <span
          className={cn(
            "font-black tracking-wide text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]",
            sizes.value
          )}
        >
          {accuracy === null ? "—" : `${Math.round(accuracy)}%`}
        </span>
      </div>
    </div>
  )
}

export interface PracticeModeBadgeProps {
  className?: string
}

/** Kept for parity with the existing mastery screens. */
export function PracticeModeBadge({ className }: PracticeModeBadgeProps) {
  return (
    <div
      className={cn(
        "rounded-full border-4 border-[#a4cba9] bg-[#2d5e3e]/95 px-4 py-1.5 shadow-[0_4px_0_#1e422b] backdrop-blur-md md:px-6 md:py-2",
        className
      )}
    >
      <span className="font-heading text-sm font-black uppercase tracking-wider text-white drop-shadow-md md:text-base">
        Practice Mode
      </span>
    </div>
  )
}
