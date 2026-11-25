import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FocusViewToggleProps {
  enabled: boolean
  onToggle: () => void
  className?: string
}

/**
 * Opt-in decluttering control for game screens. Lives outside the decorative
 * elements it hides, so it remains reachable while Focus View is on.
 */
export function FocusViewToggle({
  enabled,
  onToggle,
  className,
}: FocusViewToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={enabled}
      aria-label={
        enabled
          ? "Lumabas sa Focus View (Exit Focus View)"
          : "Buksan ang Focus View (Open Focus View)"
      }
      onClick={onToggle}
      className={cn(
        "touch-target flex items-center gap-2 rounded-full border-2 border-white/80 bg-white/85 px-3 py-1.5 font-heading text-xs font-black text-[#2b5c3b] shadow-[0_4px_0_rgba(0,0,0,0.12)] transition-colors hover:bg-white md:text-sm",
        enabled && "border-[#2d5e3e] bg-[#2d5e3e] text-white hover:bg-[#245030]",
        className
      )}
    >
      {enabled ? (
        <EyeOff className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Eye className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{enabled ? "Focus View On" : "Focus View"}</span>
    </button>
  )
}
