import { ArrowLeft } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { BilingualText } from "@/components/common/BilingualText"
import { STRINGS } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export type PracticeStepState = "done" | "current" | "pending"

export interface PracticeStep {
  label: string
  state: PracticeStepState
  /** Optional 0-100 result, shown under the label in the step pill. */
  progress?: number
}

export interface PracticeHeaderProps {
  title: string
  subtitle?: string
  backLabel?: string
  onBack?: () => void
  badge?: string
  /** Label for the current phase, e.g. "Gawain 2 ng 5". */
  progressLabel?: string
  progressLabelEn?: string
  /** 0-100. */
  progressValue?: number
  /** Sub-level / phase rail rendered as snoopy-style pill tabs. */
  steps?: PracticeStep[]
  /** Stick to the top of the scroll container (module screens). */
  sticky?: boolean
  className?: string
}

/**
 * Snoopy-style practice HUD: sticker back button, chunky title, pill-tab
 * phase rail and a single progress card. Shared by every practice and
 * module screen so navigation and progress read identically everywhere.
 * Titles and subtitles stay Filipino-only; progress and feedback carry
 * an English partner.
 */
export function PracticeHeader({
  title,
  subtitle,
  backLabel = "Bumalik",
  onBack,
  badge,
  progressLabel,
  progressLabelEn,
  progressValue,
  steps,
  sticky = false,
  className,
}: PracticeHeaderProps) {
  return (
    <header
      className={cn(
        "mb-3",
        sticky &&
          "sticky top-0 z-20 -mx-2.5 -mt-2.5 mb-2.5 border-b-4 border-white/70 bg-[#f4f9f0]/85 px-2.5 pb-2 pt-2.5 backdrop-blur-md sm:-mx-4 sm:-mt-4 sm:px-4 sm:pt-3 lg:-mx-5 lg:-mt-5 lg:px-5 lg:pt-4",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="touch-target group flex items-center gap-2 rounded-2xl border-2 border-white bg-white/80 px-3 py-1.5 font-black text-[#2b5c3b] shadow-[0_4px_0_rgba(0,0,0,0.12)] transition-all hover:brightness-105 active:translate-y-0.5 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform group-hover:-translate-x-1"
              aria-hidden="true"
            />
            <span className="text-sm">{backLabel}</span>
          </button>
        ) : (
          <span />
        )}

        {badge && (
          <span className="shrink-0 rounded-full border-2 border-white bg-[#FFC107] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#5D4037] shadow-[0_4px_0_#D4A017]">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-2">
        <h1 className="heading-snoopy text-2xl drop-shadow-[0_2px_0_rgba(255,255,255,0.65)] sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-xs font-bold text-[#3f7d52] sm:text-sm">
            {subtitle}
          </p>
        )}
      </div>

      {steps && steps.length > 0 && (
        <div className="scrollbar-none mt-2 flex gap-2 overflow-x-auto pb-1">
          {steps.map((step) => (
            <div
              key={step.label}
              className={cn(
                "flex-shrink-0 rounded-2xl border-2 border-white px-3 py-1.5 text-center shadow-[0_4px_0_rgba(0,0,0,0.12)]",
                step.state === "current" && "bg-[#FFC107] text-[#5D4037]",
                step.state === "done" && "bg-[#4CAF50] text-white",
                step.state === "pending" && "bg-white/70 text-[#2b5c3b]/60"
              )}
            >
              <div className="text-xs font-black">{step.label}</div>
              {typeof step.progress === "number" && (
                <div className="text-[10px] font-bold opacity-80">
                  {Math.round(step.progress)}%
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(progressLabel !== undefined || progressValue !== undefined) && (
        <div className="mt-2 rounded-2xl border-2 border-white bg-white/70 p-2.5 shadow-[0_4px_0_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between gap-3">
            {progressLabel !== undefined ? (
              <BilingualText
                as="span"
                className="min-w-0 text-left"
                fil={progressLabel}
                en={progressLabelEn ?? ""}
                filClassName="text-xs font-black text-[#2b5c3b] sm:text-sm"
                enClassName="text-[10px] font-bold text-[#5a7a63]"
              />
            ) : (
              <span />
            )}
            {progressValue !== undefined && (
              <span className="shrink-0 text-sm font-black text-[#2b5c3b]">
                {Math.round(progressValue)}%
              </span>
            )}
          </div>
          {progressValue !== undefined && (
            <Progress
              value={progressValue}
              aria-label={`${STRINGS.progressAria.fil} (${STRINGS.progressAria.en})`}
              className="mt-1.5 h-3.5 bg-[#d9e8d3]"
            />
          )}
        </div>
      )}
    </header>
  )
}
