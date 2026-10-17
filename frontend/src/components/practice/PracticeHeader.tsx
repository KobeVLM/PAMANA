import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BilingualText } from "@/components/common/BilingualText"
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
  score?: number
  /** Label for the current phase, e.g. "2. Pakinggan (2 of 4)". */
  progressLabel?: string
  progressLabelEn?: string
  /** 0-100. */
  progressValue?: number
  steps?: PracticeStep[]
  className?: string
}

/**
 * Back button + title + progress card + optional step chips.
 * Shared by every practice and module screen so navigation and progress
 * read identically everywhere. Titles and subtitles stay Filipino-only;
 * only the progress line carries an English partner.
 */
export function PracticeHeader({
  title,
  subtitle,
  backLabel = "Bumalik",
  onBack,
  badge,
  score,
  progressLabel,
  progressLabelEn,
  progressValue,
  steps,
  className,
}: PracticeHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="touch-target group mb-4 flex items-center gap-2 rounded-xl text-green-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform group-hover:-translate-x-1"
            aria-hidden="true"
          />
          <span className="text-sm font-medium">{backLabel}</span>
        </button>
      )}

      <div className="mb-1 flex items-start justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-white">{title}</h1>
        {badge && (
          <Badge
            variant="outline"
            className="shrink-0 border-pamana-gold/40 bg-pamana-gold/10 text-xs text-pamana-gold"
          >
            {badge}
          </Badge>
        )}
      </div>
      {subtitle && <p className="text-sm text-green-300">{subtitle}</p>}

      {(progressLabel || score !== undefined || progressValue !== undefined) && (
        <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <BilingualText
              as="span"
              fil={progressLabel ?? ""}
              en={progressLabelEn ?? ""}
              filClassName="font-semibold text-white"
              enClassName="text-xs font-normal text-green-200/70"
            />
            {score !== undefined && (
              <div
                className="flex items-center gap-1.5 font-bold text-pamana-gold"
                aria-label={`${STRINGS.score.fil}: ${score} / ${STRINGS.score.en}: ${score}`}
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <BilingualText
                  as="span"
                  fil={`${STRINGS.score.fil}: ${score}`}
                  en={`${STRINGS.score.en}: ${score}`}
                  filClassName="font-bold text-pamana-gold"
                  enClassName="text-xs font-normal text-pamana-gold/80"
                />
              </div>
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

      {steps && steps.length > 0 && (
        <ol className="scrollbar-none mt-4 flex gap-2 overflow-x-auto pb-1">
          {steps.map((step) => (
            <li
              key={step.label}
              aria-current={step.state === "current" ? "step" : undefined}
              className={cn(
                "flex flex-shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
                step.state === "current" &&
                  "border-pamana-gold bg-pamana-gold/20 text-pamana-gold",
                step.state === "done" &&
                  "border-green-500/40 bg-green-500/20 text-green-300",
                step.state === "pending" &&
                  "border-white/10 bg-white/5 text-white/40"
              )}
            >
              {step.state === "done" && (
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              )}
              <span>{step.label}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
