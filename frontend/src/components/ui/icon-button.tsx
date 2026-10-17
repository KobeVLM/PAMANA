import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const SIZE_CLASSES = {
  sm: "h-9 w-9 [&_svg]:size-4",
  default: "h-11 w-11 [&_svg]:size-5",
  lg: "h-12 w-12 [&_svg]:size-6",
} as const

export interface IconButtonProps extends Omit<ButtonProps, "size" | "aria-label"> {
  /** Required: icon-only buttons must be labelled for screen readers. */
  "aria-label": string
  size?: keyof typeof SIZE_CLASSES
}

/**
 * Accessible icon-only button. Wraps Button, enforces an aria-label,
 * and guarantees a >= 36px (default 44px) touch target.
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = "default", ...props }, ref) => (
    <Button
      ref={ref}
      size="icon"
      className={cn("shrink-0 rounded-full", SIZE_CLASSES[size], className)}
      {...props}
    />
  )
)
IconButton.displayName = "IconButton"
