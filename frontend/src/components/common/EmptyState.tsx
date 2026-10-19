import * as React from "react"
import { cn } from "@/lib/utils"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
}

/**
 * Friendly "nothing here yet" state with an optional call to action.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-white/20 bg-white/5 px-6 py-10 text-center",
        className
      )}
      {...props}
    >
      {icon && (
        <span className="text-green-300" aria-hidden="true">
          {icon}
        </span>
      )}
      <h2 className="font-heading text-lg font-bold text-white">{title}</h2>
      {description && (
        <p className="max-w-sm text-sm leading-relaxed text-green-200">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
