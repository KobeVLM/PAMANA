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
    container: "border-[#4CAF50] bg-[#e7f6e7] text-[#1B5E20]",
    icon: "text-[#2E7D32]",
    Icon: CheckCircle2,
  },
  incorrect: {
    container: "border-[#EF5350] bg-[#fdeaea] text-[#8f1d1d]",
    icon: "text-[#c62828]",
    Icon: RefreshCw,
  },
  hint: {
    container: "border-[#FFC107] bg-[#fff7db] text-[#7a5200]",
    icon: "text-[#D4A017]",
    Icon: Lightbulb,
  },
  info: {
    container: "border-[#d5e5d0] bg-white text-[#2b5c3b]",
    icon: "text-[#3f7d52]",
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
          "flex items-center gap-3 rounded-2xl border-2 px-4 py-3 font-heading font-bold shadow-[0_6px_0_rgba(0,0,0,0.12)]",
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
