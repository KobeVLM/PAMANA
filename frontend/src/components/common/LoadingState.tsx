import * as React from "react"
import { Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
  /** Render skeleton blocks instead of a spinner. */
  skeletonRows?: number
}

/**
 * Accessible loading indicator. Communicates busy state to assistive tech.
 */
export function LoadingState({
  message = "Naglo-load...",
  skeletonRows,
  className,
  ...props
}: LoadingStateProps) {
  if (skeletonRows && skeletonRows > 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn("w-full space-y-3", className)}
        {...props}
      >
        <span className="sr-only">{message}</span>
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-10",
        className
      )}
      {...props}
    >
      <Loader2 className="h-8 w-8 animate-spin text-pamana-gold" aria-hidden="true" />
      <p className="font-heading font-semibold text-green-200">{message}</p>
    </div>
  )
}
