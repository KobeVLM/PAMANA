import { CheckCircle2, Lightbulb, RefreshCw } from 'lucide-react'
import { HINT_AFTER_ATTEMPTS } from '@/components/game/constants'
import { cn } from '@/lib/utils'

export interface FillBlankOption {
  id: string
  label: string
}

interface FillBlankProps {
  /** Sentence containing a run of underscores as the blank placeholder. */
  template: string
  options: FillBlankOption[]
  /** Currently placed option (null = empty blank). */
  selectedId?: string | null
  /** Revealed answer id, used for the hint highlight. */
  correctId?: string | null
  onSelect: (optionId: string) => void
  attempts?: number
  disabled?: boolean
  className?: string
}

/** Backend templates use four underscores; accept a longer run too. */
const BLANK_PATTERN = /_{4,}/

/**
 * Tap-to-fill sentence: tap a word chip to drop it into the blank, then the
 * parent flow checks it. Green when correct, red + wiggle while retrying,
 * gold hint on the chip once the attempt threshold is reached.
 */
export function FillBlank({
  template,
  options,
  selectedId = null,
  correctId = null,
  onSelect,
  attempts = 0,
  disabled = false,
  className,
}: FillBlankProps) {
  const [before, ...rest] = template.split(BLANK_PATTERN)
  const after = rest.join('____')

  const selectedLabel =
    options.find((option) => option.id === selectedId)?.label ?? null
  const isCorrect = Boolean(selectedId && correctId && selectedId === correctId)
  const isWrong = Boolean(selectedId && correctId && selectedId !== correctId)
  const showHint = attempts >= HINT_AFTER_ATTEMPTS && correctId

  return (
    <div className={cn('w-full space-y-5', className)}>
      <p className="text-center font-heading text-lg leading-relaxed text-white sm:text-xl">
        {before}
        <span
          className={cn(
            'mx-1 inline-flex min-h-[2.5rem] min-w-[6rem] items-center justify-center rounded-xl border-2 px-3 align-middle font-bold',
            isCorrect &&
              'border-green-400 bg-green-500/25 text-green-100 shadow-green-900/40',
            isWrong && 'animate-wiggle border-red-400/70 bg-red-500/20 text-red-100',
            !isCorrect &&
              !isWrong &&
              selectedLabel &&
              'border-pamana-gold/70 bg-pamana-gold/15 text-pamana-gold',
            !selectedLabel &&
              'border-dashed border-pamana-gold/60 bg-white/5 text-pamana-gold/70'
          )}
        >
          {selectedLabel ?? '?'}
        </span>
        {after}
      </p>

      <div
        role="group"
        aria-label="Mga salitang mapagpipilian (Word choices)"
        className="flex flex-wrap items-center justify-center gap-2.5"
      >
        {options.map((option) => {
          const isThisSelected = option.id === selectedId
          const isThisHint = Boolean(showHint && option.id === correctId)

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(option.id)}
              className={cn(
                'game-tile relative min-h-[48px] rounded-2xl border-2 px-5 py-2.5 font-heading text-base font-bold text-white shadow-md transition-all duration-200 sm:text-lg',
                isThisSelected &&
                  isCorrect &&
                  'border-green-400 bg-green-500/30 text-green-100',
                isThisSelected &&
                  isWrong &&
                  'animate-wiggle border-red-400/70 bg-red-500/20 text-red-100',
                isThisHint &&
                  'animate-pulse border-pamana-gold bg-pamana-gold/20 text-pamana-gold',
                !isThisSelected &&
                  !isThisHint &&
                  'hover:scale-105 hover:border-white/60 hover:bg-white/30',
                disabled && 'cursor-not-allowed opacity-60'
              )}
            >
              {option.label}
              {isThisSelected && (
                <span className="absolute -right-1.5 -top-1.5" aria-hidden="true">
                  {isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : (
                    <RefreshCw className="h-5 w-5 text-red-300" />
                  )}
                </span>
              )}
              {isThisHint && !isThisSelected && (
                <span className="absolute -right-1.5 -top-1.5" aria-hidden="true">
                  <Lightbulb className="h-5 w-5 text-pamana-gold" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
