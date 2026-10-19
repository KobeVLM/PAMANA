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
        "flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-[#EF5350]/60 bg-[#fdeaea] px-6 py-10 text-center",
        className
      )}
      {...props}
    >
      <CloudOff className="h-10 w-10 text-[#c62828]" aria-hidden="true" />
      <h2 className="font-heading text-lg font-bold text-[#8f1d1d]">{title}</h2>
      <p className="max-w-sm text-sm leading-relaxed text-[#8f1d1d]/90">{description}</p>
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
