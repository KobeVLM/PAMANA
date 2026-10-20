import { cn } from '@/lib/utils'

export type StepState = 'done' | 'current' | 'pending'

export interface StepDotItem {
  label: string
  state: StepState
}

const STATE_TEXT: Record<StepState, string> = {
  done: 'tapos na (done)',
  current: 'kasalukuyan (current)',
  pending: 'susunod pa (pending)',
}

interface StepDotsProps {
  steps: StepDotItem[]
  className?: string
}

/**
 * Compact replacement for the step-chip rail: one dot per step with the
 * current step's label beside it. Screen readers get the full label+state.
 */
export function StepDots({ steps, className }: StepDotsProps) {
  const current = steps.find((step) => step.state === 'current')

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <ol aria-label="Mga hakbang (Steps)" className="flex items-center gap-2">
        {steps.map((step, index) => (
          <li
            key={`${index}-${step.label}`}
            aria-current={step.state === 'current' ? 'step' : undefined}
            className="flex items-center"
          >
            <span
              aria-hidden="true"
              className={cn(
                'h-2.5 w-2.5 rounded-full transition-colors',
                step.state === 'current' &&
                  'bg-pamana-gold ring-2 ring-pamana-gold/40',
                step.state === 'done' && 'bg-green-400',
                step.state === 'pending' && 'bg-white/20'
              )}
            />
            <span className="sr-only">{`${step.label} — ${STATE_TEXT[step.state]}`}</span>
          </li>
        ))}
      </ol>
      {current && (
        <span
          aria-hidden="true"
          className="truncate text-xs font-semibold text-pamana-gold"
        >
          {current.label}
        </span>
      )}
    </div>
  )
}
