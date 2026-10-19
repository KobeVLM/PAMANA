import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PracticeStageProps {
  /** Prompt side: NPC line, PromptStage and the feedback slot. */
  stage: ReactNode
  /** Answer side: option grid, word tiles or fill-in-the-blank chips. */
  tray: ReactNode
  /** Two columns from `lg` (default). Disable for single-column steps. */
  split?: boolean
  className?: string
}

/**
 * Stage & Tray layout: one column on phones and narrow frames so the prompt
 * stays above the fold, two columns from `xl` once there is room for both.
 * The tray is not sticky: it would slide under the module screens' sticky HUD.
 */
export function PracticeStage({
  stage,
  tray,
  split = true,
  className,
}: PracticeStageProps) {
  if (!split) {
    return (
      <div className={cn('space-y-2.5 sm:space-y-3', className)}>
        {stage}
        {tray}
      </div>
    )
  }

  return (
    <div
      className={cn('xl:grid xl:grid-cols-2 xl:items-start xl:gap-5', className)}
    >
      <div className="min-w-0 space-y-2.5 sm:space-y-3">{stage}</div>
      <div className="mt-2.5 min-w-0 xl:mt-0">{tray}</div>
    </div>
  )
}
