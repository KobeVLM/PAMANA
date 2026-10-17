import * as React from "react"
import { CloudOff, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: React.ReactNode
  onRetry?: () => void
  retryLabel?: string
  retrying?: boolean
}

/**
 * User-facing failure state with an explicit retry action.
 * Announced assertively so screen readers hear the problem.
 */
export function ErrorState({
  title = "May problema sa pagkonekta",
  description = "Hindi namin makuha ang datos ngayon. Pakisubukan muli.",
  onRetry,
  retryLabel = "Subukan Muli",
  retrying = false,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-red-400/40 bg-red-500/10 px-6 py-10 text-center",
        className
      )}
      {...props}
    >
      <CloudOff className="h-10 w-10 text-red-300" aria-hidden="true" />
      <h2 className="font-heading text-lg font-bold text-white">{title}</h2>
      <p className="max-w-sm text-sm leading-relaxed text-red-100/90">{description}</p>
      {onRetry && (
        <Button
          variant="pamana"
          onClick={onRetry}
          loading={retrying}
          className="mt-2"
        >
          {!retrying && <RotateCcw aria-hidden="true" />}
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
