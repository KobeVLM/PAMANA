"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  // Fill from empty on mount, then let the CSS transition glide between
  // values, so the bar never snaps straight to its percentage.
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 20)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-transform duration-700 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${100 - (ready ? value || 0 : 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
