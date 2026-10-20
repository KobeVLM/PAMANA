import * as React from "react"
import { AppShell } from "@/components/layout/AppShell"
import { DotGrid } from "@/components/background/DotGrid"
import { cn } from "@/lib/utils"

export interface PracticePageLayoutProps {
  children: React.ReactNode
  /** Max content width; `5xl` is for the two-column Stage & Tray screens. */
  maxWidth?: "xl" | "2xl" | "3xl" | "5xl"
  className?: string
}

const MAX_WIDTH: Record<
  NonNullable<PracticePageLayoutProps["maxWidth"]>,
  string
> = {
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "5xl": "max-w-5xl",
}

/**
 * Standard page frame for gameplay/practice screens:
 * AppShell + snoopy sky-to-meadow gradient backdrop + animated dot grid +
 * centred, padded, safe-area aware content column.
 */
export function PracticePageLayout({
  children,
  maxWidth = "2xl",
  className,
}: PracticePageLayoutProps) {
  return (
    <AppShell>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-[#87CEEB] to-[#98FB98]"
      >
        <DotGrid
          baseColor="#2b5c3b"
          activeColor="#FFC107"
          shape="circle"
          dotSize={4}
          gap={18}
          proximity={175}
          strength={0.9}
          bounce={0.3}
          tension={0.4}
          returnDuration={0.5}
          swell={0.45}
          stretch={0.2}
          glow={0.5}
          fade={0.35}
          opacity={0.18}
          intro
          mouseInteraction
          clickShock={false}
        />
      </div>
      <div
        className={cn(
          "relative z-10 mx-auto min-h-full w-full p-2.5 pb-safe sm:p-4 lg:p-5",
          MAX_WIDTH[maxWidth],
          className
        )}
      >
        {children}
      </div>
    </AppShell>
  )
}
