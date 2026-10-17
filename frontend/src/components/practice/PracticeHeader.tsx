import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BilingualText } from "@/components/common/BilingualText"
import { StepDots, type StepDotItem } from "@/components/practice/StepDots"
import { StarMeter } from "@/components/practice/StarMeter"
import { STRINGS } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export type PracticeStepState = "done" | "current" | "pending"

export interface PracticeStep {
  label: string
  state: PracticeStepState
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
  steps?: PracticeStep[]
  /** Live accuracy (0-100) for the star meter; `null` shows empty stars. */
  accuracy?: number | null
  /** Optional remaining-items counter shown beside the star meter. */
  itemsLeft?: { fil: string; en: string }
  /** Stick to the top of the scroll container (module screens). */
  sticky?: boolean
  className?: string
}

/**
 * Compact practice HUD: back button, star meter, title and a single
 * progress card (step dots + label + bar). Shared by every practice and
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
  accuracy,
  itemsLeft,
  sticky = false,
  className,
}: PracticeHeaderProps) {
  const stepDots: StepDotItem[] | undefined = steps
  const hasProgressCard =
    Boolean(steps?.length) ||
    progressLabel !== undefined ||
    progressValue !== undefined

  return (
    <header
      className={cn(
        "mb-3",
        sticky &&
          "sticky top-0 z-20 -mx-2.5 -mt-2.5 mb-2.5 border-b border-white/5 bg-green-950/85 px-2.5 pb-2 pt-2.5 backdrop-blur-md sm:-mx-4 sm:-mt-4 sm:px-4 sm:pt-3 lg:-mx-5 lg:-mt-5 lg:px-5 lg:pt-4",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="touch-target group flex items-center gap-2 rounded-xl text-green-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform group-hover:-translate-x-1"
              aria-hidden="true"
            />
            <span className="text-sm font-medium">{backLabel}</span>
          </button>
        ) : (
          <span />
        )}

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {itemsLeft && (
            <span className="shrink-0 rounded-full border border-pamana-gold/40 bg-pamana-gold/10 px-2 py-0.5 text-center">
              <BilingualText
                as="span"
                fil={itemsLeft.fil}
                en={itemsLeft.en}
                filClassName="text-[10px] font-bold leading-tight text-pamana-gold"
                enClassName="text-[9px] font-normal leading-tight text-pamana-gold/70"
              />
            </span>
          )}
          {accuracy !== undefined && <StarMeter accuracy={accuracy} />}
          {badge && (
            <Badge
              variant="outline"
              className="shrink-0 border-pamana-gold/40 bg-pamana-gold/10 text-xs text-pamana-gold"
            >
              {badge}
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-xl font-bold text-white sm:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-xs text-green-300/90 sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {hasProgressCard && (
        <div className="mt-2 space-y-1 rounded-2xl border border-white/10 bg-white/5 p-2 sm:p-2.5">
          <div className="flex items-center justify-between gap-3">
            {stepDots && stepDots.length > 0 ? (
              <StepDots steps={stepDots} />
            ) : (
              <span />
            )}
            {progressLabel !== undefined && (
              <BilingualText
                as="span"
                className="shrink-0 text-right"
                fil={progressLabel}
                en={progressLabelEn ?? ""}
                filClassName="text-xs font-semibold text-white sm:text-sm"
                enClassName="text-[10px] font-normal text-green-200/70"
              />
            )}
          </div>
          {progressValue !== undefined && (
            <Progress
              value={progressValue}
              aria-label={`${STRINGS.progressAria.fil} (${STRINGS.progressAria.en})`}
              className="h-2.5 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-pamana-green [&>div]:to-emerald-400"
            />
          )}
        </div>
      )}
    </header>
  )
}
