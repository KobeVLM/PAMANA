import * as React from "react"
import { AppShell } from "@/components/layout/AppShell"
import { DotGrid } from "@/components/background/DotGrid"
import { cn } from "@/lib/utils"

export interface PracticePageLayoutProps {
  children: React.ReactNode
  className?: string
}

/**
 * Standard page frame for gameplay/practice screens:
 * AppShell + animated dot-grid backdrop + centred, padded,
 * safe-area aware content column.
 */
export function PracticePageLayout({
  children,
  className,
}: PracticePageLayoutProps) {
  return (
    <AppShell>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
      >
        <DotGrid
          baseColor="#2d4301"
          activeColor="#d3ca19"
          shape="circle"
          dotSize={5}
          gap={17}
          proximity={175}
          strength={0.9}
          bounce={0.3}
          tension={0.4}
          returnDuration={0.5}
          swell={0.45}
          stretch={0.2}
          glow={0.65}
          fade={0.35}
          opacity={0.55}
          intro
          mouseInteraction
          clickShock={false}
        />
      </div>
      <div
        className={cn(
          "relative z-10 mx-auto min-h-full w-full max-w-2xl p-4 pb-safe sm:p-6 lg:p-8",
          className
        )}
      >
        {children}
      </div>
    </AppShell>
  )
}
