import { RotateCcw } from "lucide-react"
import { FeedbackBanner } from "@/components/feedback/FeedbackBanner"
import { STRINGS } from "@/lib/i18n"
import { scaffoldGuidance, type ScaffoldStage } from "@/lib/scaffolding"
import { cn } from "@/lib/utils"

export interface ScaffoldMessageProps {
  stage: ScaffoldStage
  /** The correct syllable/word shown in the stage-3 comparison. */
  target?: string
  /** Sound parts, e.g. ["B", "A"] for "BA". */
  parts?: string[]
  /** Stage 1 replays the target sound. */
  onReplay?: () => void
  /** Stage 3 asks for a confirming tap before play continues. */
  onConfirm?: () => void
  className?: string
}

/**
 * The wording layer of the 3-stage progressive error scaffolding. Visual
 * narrowing (fading one distractor, highlighting the target) is done by the
 * game screen using {@link scaffoldStage} and {@link fadedDistractorId}.
 */
export function ScaffoldMessage({
  stage,
  target,
  parts = [],
  onReplay,
  onConfirm,
  className,
}: ScaffoldMessageProps) {
  if (stage === 0) return null

  const guidance = scaffoldGuidance(stage, target)

  return (
    <FeedbackBanner
      variant="hint"
      className={cn("flex-wrap", className)}
      data-scaffold-stage={stage}
    >
      <span className="block text-sm font-black md:text-base">
        {guidance.message.fil}
      </span>
      <span className="block text-xs font-semibold opacity-80 md:text-sm">
        {guidance.message.en}
      </span>

      {stage === 1 && onReplay && (
        <button
          type="button"
          onClick={onReplay}
          className="touch-target mt-2 inline-flex items-center gap-1.5 rounded-full border-2 border-[#D4A017] bg-white px-3 py-1 text-xs font-black text-[#7a5200] hover:bg-[#fff7db] md:text-sm"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {STRINGS.listenAgain.fil} / {STRINGS.listenAgain.en}
        </button>
      )}

      {stage >= 3 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {parts.map((part, index) => (
            <span
              key={`${part}-${index}`}
              className="rounded-lg border-2 border-[#D4A017] bg-white px-2 py-1 text-lg font-black uppercase text-[#7a5200]"
            >
              {part}
            </span>
          ))}
          {parts.length > 0 && <span className="font-black text-[#7a5200]">+</span>}
          {target && (
            <span className="rounded-lg border-2 border-[#4CAF50] bg-[#e7f6e7] px-2 py-1 text-lg font-black uppercase text-[#1B5E20]">
              {target}
            </span>
          )}
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              className="touch-target rounded-full border-2 border-[#2d5e3e] bg-[#2d5e3e] px-4 py-1.5 text-xs font-black text-white hover:bg-[#245030] md:text-sm"
            >
              Kumpirmahin / Confirm
            </button>
          )}
        </div>
      )}
    </FeedbackBanner>
  )
}
