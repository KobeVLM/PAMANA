import { Star } from 'lucide-react'
import { MEDAL_STYLES, getMedalTier, starsForAccuracy } from '@/lib/medals'
import { cn } from '@/lib/utils'

interface StarMeterProps {
  accuracy: number | null
  size?: 'sm' | 'md'
  className?: string
}

const TIER_LABELS = {
  bronze: 'Tanso (Bronze)',
  silver: 'Pilak (Silver)',
  gold: 'Ginto (Gold)',
} as const

/**
 * Live 0–3 star meter mirroring the Trail Map medals
 * (bronze < 85 ≤ silver < 95 ≤ gold).
 */
export function StarMeter({ accuracy, size = 'sm', className }: StarMeterProps) {
  const filled = starsForAccuracy(accuracy)
  const tier = getMedalTier(accuracy)
  const fillColor = filled > 0 ? MEDAL_STYLES[tier].fillColor : undefined
  const iconClass = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6'

  const label =
    accuracy === null
      ? 'Wala pang iskor (No score yet)'
      : `${Math.round(accuracy)}% — ${TIER_LABELS[tier]}`

  return (
    <div
      role="img"
      aria-label={label}
      className={cn('flex shrink-0 items-center gap-0.5', className)}
    >
      {[0, 1, 2].map((index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={cn(
            iconClass,
            index < filled ? 'fill-current' : 'text-white/20'
          )}
          style={index < filled ? { color: fillColor } : undefined}
        />
      ))}
    </div>
  )
}
