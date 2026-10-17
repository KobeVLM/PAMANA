import type { ReactNode } from "react"
import { Home, RotateCcw, Sparkles, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Celebration } from "@/components/feedback/Celebration"
import { BilingualText } from "@/components/common/BilingualText"
import { STRINGS, encouragementFor } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export interface PracticeCompletionProps {
  title?: string
  message: string
  messageEn?: string
  /** Score display; omit for pass/fail milestones without a countable score. */
  score?: number
  total?: number
  onRetry: () => void
  retryLabel?: string
  retryLabelEn?: string
  /** Show a spinner on the retry button (e.g. while resetting a module). */
  retrying?: boolean
  onExit?: () => void
  exitLabel?: string
  /** Override the automatic encouragement line. */
  encouragement?: string
  encouragementEn?: string
  /** Replaces the trophy badge with a character illustration. */
  illustration?: ReactNode
  /** Fire confetti on mount (default true). */
  celebrate?: boolean
  className?: string
}

/**
 * Shared "run complete" screen: celebration, score, encouragement, retry/exit.
 * The title and exit button stay Filipino-only; the result message,
 * encouragement and action labels carry English.
 */
export function PracticeCompletion({
  title = STRINGS.practiceComplete.fil,
  message,
  messageEn,
  score,
  total,
  onRetry,
  retryLabel = STRINGS.playAgain.fil,
  retryLabelEn = STRINGS.playAgain.en,
  retrying = false,
  onExit,
  exitLabel = STRINGS.backHome.fil,
  encouragement,
  encouragementEn,
  illustration,
  celebrate = true,
  className,
}: PracticeCompletionProps) {
  const hasScore = typeof score === "number" && typeof total === "number"
  const safeTotal = Math.max(total ?? 1, 1)
  const percentage = hasScore ? Math.round(((score ?? 0) / safeTotal) * 100) : 100
  const encouragementBi = encouragement
    ? { fil: encouragement, en: encouragementEn ?? "" }
    : encouragementFor(percentage)

  return (
    <div className="flex min-h-full items-center justify-center p-4 pb-safe sm:p-6 lg:p-8">
      <Celebration trigger={celebrate} intensity={percentage >= 75 ? "large" : "medium"} />
      <section
        role="status"
        aria-live="polite"
        className={cn(
          "card-story w-full max-w-md p-6 text-center sm:p-8 animate-bounce-in",
          className
        )}
      >
        <div className="mb-6 flex justify-center">
          {illustration ? (
            illustration
          ) : (
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-pamana-gold to-amber-500 shadow-xl shadow-amber-950/40 sm:h-28 sm:w-28">
                <Trophy
                  className="h-12 w-12 text-stone-900 sm:h-14 sm:w-14"
                  aria-hidden="true"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-pamana-green p-2 shadow">
                <Sparkles className="h-4 w-4 text-white" aria-hidden="true" />
              </div>
            </div>
          )}
        </div>

        <h2 className="mb-2 font-heading text-2xl font-bold text-white sm:text-3xl">
          {title}
        </h2>
        <BilingualText
          as="p"
          fil={message}
          en={messageEn ?? ""}
          className="mb-6"
          filClassName="text-sm text-green-300"
          enClassName="text-xs text-green-200/70"
        />

        {hasScore && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            <BilingualText
              as="p"
              fil={STRINGS.yourScore.fil}
              en={STRINGS.yourScore.en}
              className="mb-1"
              filClassName="text-xs font-semibold uppercase tracking-wider text-green-300"
              enClassName="text-[10px] uppercase tracking-wider text-green-200/60"
            />
            <p className="mb-1 font-heading text-4xl font-extrabold text-pamana-gold">
              {score} / {safeTotal}
            </p>
            <BilingualText
              as="p"
              fil={`${percentage}% ${STRINGS.accuracy.fil}`}
              en={`${percentage}% ${STRINGS.accuracy.en}`}
              filClassName="text-sm font-medium text-emerald-400"
              enClassName="text-xs text-emerald-300/70"
            />
            <BilingualText
              as="p"
              fil={encouragementBi.fil}
              en={encouragementBi.en}
              className="mt-3"
              filClassName="text-xs text-white/70"
              enClassName="text-xs text-white/60"
            />
          </div>
        )}

        <div className="space-y-3">
          <Button
            variant="gold"
            onClick={onRetry}
            loading={retrying}
            className="w-full text-stone-900 [&_svg]:text-stone-900"
          >
            {!retrying && <RotateCcw aria-hidden="true" />}
            <BilingualText
              as="span"
              fil={retryLabel}
              en={retryLabelEn}
              filClassName="text-sm font-semibold"
              enClassName="text-xs font-normal opacity-80"
            />
          </Button>
          {onExit && (
            <Button variant="ghost" onClick={onExit} className="w-full border border-white/20">
              <Home aria-hidden="true" />
              <span className="text-sm font-semibold">{exitLabel}</span>
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}
