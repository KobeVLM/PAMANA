import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FeedbackSlotProps {
  children?: ReactNode
  className?: string
}

/**
 * Fixed-height slot for FeedbackBanner (and hints) so appearing and
 * disappearing messages never shift the answer tray below them.
 */
export function FeedbackSlot({ children, className }: FeedbackSlotProps) {
  return (
    <div
      data-empty={children ? undefined : 'true'}
      className={cn(
        'flex min-h-[40px] items-center [&>*]:w-full sm:min-h-[44px]',
        className
      )}
    >
      {children}
    </div>
  )
}
