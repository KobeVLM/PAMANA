import * as React from "react"
import { motion, type HTMLMotionProps } from "framer-motion"
import { CheckCircle2, Info, Lightbulb, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { popIn, useReducedMotionSafe } from "@/lib/motion"

type FeedbackVariant = "correct" | "incorrect" | "hint" | "info"

const VARIANT_STYLES: Record<
  FeedbackVariant,
  { container: string; icon: string; Icon: React.ElementType }
> = {
  correct: {
    container: "border-green-400/70 bg-green-500/20 text-green-100",
    icon: "text-green-300",
    Icon: CheckCircle2,
  },
  incorrect: {
    container: "border-red-400/60 bg-red-500/15 text-red-50",
    icon: "text-red-300",
    Icon: RefreshCw,
  },
  hint: {
    container: "border-pamana-gold/70 bg-pamana-gold/15 text-amber-100",
    icon: "text-pamana-gold",
    Icon: Lightbulb,
  },
  info: {
    container: "border-white/20 bg-white/10 text-green-100",
    icon: "text-green-300",
    Icon: Info,
  },
}

export interface FeedbackBannerProps extends HTMLMotionProps<"div"> {
  variant?: FeedbackVariant
  /** Announce assertively (use for errors the learner must notice). */
  assertive?: boolean
  /** Hide the leading status icon. */
  hideIcon?: boolean
}

/**
 * Single source of truth for correct/incorrect/hint messages.
 * Announced to screen readers via a live region.
 */
export const FeedbackBanner = React.forwardRef<
  HTMLDivElement,
  FeedbackBannerProps
>(
  (
    {
      variant = "info",
      assertive = false,
      hideIcon = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { container, icon, Icon } = VARIANT_STYLES[variant]
    const reduceMotion = useReducedMotionSafe()

    return (
      <motion.div
        ref={ref}
        variants={reduceMotion ? undefined : popIn}
        initial={reduceMotion ? undefined : "hidden"}
        animate={reduceMotion ? undefined : "visible"}
        role={assertive ? "alert" : "status"}
        aria-live={assertive ? "assertive" : "polite"}
        aria-atomic="true"
        className={cn(
          "flex items-center gap-3 rounded-2xl border-2 px-4 py-3 font-heading font-semibold shadow-story",
          container,
          className
        )}
        {...props}
      >
        {!hideIcon && (
          <Icon
            className={cn("h-5 w-5 shrink-0", icon)}
            aria-hidden="true"
          />
        )}
        <div className="min-w-0 flex-1">{children as React.ReactNode}</div>
      </motion.div>
    )
  }
)
FeedbackBanner.displayName = "FeedbackBanner"
