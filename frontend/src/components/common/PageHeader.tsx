import * as React from "react"
import { cn } from "@/lib/utils"

export interface PageHeaderProps {
  title: string
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  actions?: React.ReactNode
  align?: "center" | "left"
  className?: string
}

/**
 * Consistent page title block (h1 + optional subtitle + actions).
 */
export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  align = "center",
  className,
}: PageHeaderProps) {
  const centered = align === "center"
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-2",
        centered ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      <div className={cn("flex items-center gap-3", centered && "justify-center")}>
        {icon && (
          <span className="text-[#D4A017]" aria-hidden="true">
            {icon}
          </span>
        )}
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-[#2b5c3b] md:text-4xl">
          {title}
        </h1>
      </div>
      {subtitle && (
        <p className="max-w-2xl text-sm text-[#5a7a63] md:text-base">{subtitle}</p>
      )}
      {actions && <div className="mt-2 flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
