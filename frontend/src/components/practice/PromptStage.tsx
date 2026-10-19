import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type PromptStageVariant =
  | 'equation'
  | 'audio'
  | 'image-word'
  | 'blank'
  | 'canvas'

const VARIANT_MIN_HEIGHT: Record<PromptStageVariant, string> = {
  equation: 'min-h-[140px] sm:min-h-[150px]',
  audio: 'min-h-[140px] sm:min-h-[150px]',
  'image-word': 'min-h-[180px] sm:min-h-[200px]',
  blank: 'min-h-[100px]',
  canvas: 'min-h-[100px]',
}

interface PromptStageProps {
  children: ReactNode
  variant?: PromptStageVariant
  /** Accessible name for the stage region. */
  ariaLabel?: string
  className?: string
}

/**
 * Elevated "look here" surface shared by every module and practice screen:
 * the blending equation, the listen prompt, the image + word card, etc.
 */
export function PromptStage({
  children,
  variant = 'audio',
  ariaLabel,
  className,
}: PromptStageProps) {
  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        'card-story flex flex-col items-center justify-center gap-2.5 p-4 text-center sm:p-5',
        VARIANT_MIN_HEIGHT[variant],
        className
      )}
    >
      {children}
    </section>
  )
}
