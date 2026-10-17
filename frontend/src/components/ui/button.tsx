import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-heading font-bold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        pamana:
          "bg-gradient-to-r from-pamana-green to-emerald-500 text-white hover:opacity-90 active:scale-95",
        gold: "bg-gradient-to-r from-pamana-gold to-pamana-amber text-white hover:opacity-90 active:scale-95",
        success: "bg-success text-success-foreground hover:bg-success/90 active:scale-95",
        jellyPink:
          "border-2 border-[#FF9EC0] bg-gradient-to-b from-[#FF6FA1] to-[#E6005C] text-white shadow-[0_6px_0_0_#990033] hover:brightness-110 active:translate-y-[4px] active:shadow-[0_2px_0_0_#990033]",
        jellyGreen:
          "border-2 border-[#86EFAC] bg-gradient-to-b from-[#4ADE80] to-[#16A34A] text-white shadow-[0_6px_0_0_#0F5128] hover:brightness-110 active:translate-y-[4px] active:shadow-[0_2px_0_0_#0F5128]",
      },
      size: {
        default: "h-11 px-5 py-2 text-base [&_svg]:size-4",
        sm: "h-9 px-3 text-sm [&_svg]:size-4",
        lg: "h-12 px-7 text-lg [&_svg]:size-5",
        xl: "h-14 px-8 text-xl [&_svg]:size-6",
        icon: "h-11 w-11 [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Shows a spinner, disables the button, and marks it busy for assistive tech. */
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, disabled, children, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
