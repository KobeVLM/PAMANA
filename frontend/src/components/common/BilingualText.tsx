import type { ElementType } from "react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"

export interface BilingualTextProps {
  fil: string
  en: string
  /** Wrapper element; defaults to a div. */
  as?: ElementType
  className?: string
  filClassName?: string
  enClassName?: string
}

/**
 * Filipino line with the English translation underneath (when enabled in
 * Settings). The English line is smaller and slightly muted so the Filipino
 * stays visually primary.
 */
export function BilingualText({
  fil,
  en,
  as: Tag = "div",
  className,
  filClassName,
  enClassName,
}: BilingualTextProps) {
  const { showEnglish } = useLanguage()

  return (
    <Tag className={className}>
      <span className={cn("block", filClassName)}>{fil}</span>
      {showEnglish && en.length > 0 && (
        <span
          lang="en"
          className={cn("mt-0.5 block text-sm opacity-80", enClassName)}
        >
          {en}
        </span>
      )}
    </Tag>
  )
}
