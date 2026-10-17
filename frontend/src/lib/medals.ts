export type MedalTier = 'bronze' | 'silver' | 'gold'

/** Accuracy thresholds shared by the Trail Map medals and the in-module star meter. */
export const MEDAL_THRESHOLDS = { silver: 85, gold: 95 } as const

export const getMedalTier = (accuracy: number | null): MedalTier => {
  if (accuracy === null) return 'bronze'
  if (accuracy >= MEDAL_THRESHOLDS.gold) return 'gold'
  if (accuracy >= MEDAL_THRESHOLDS.silver) return 'silver'
  return 'bronze'
}

export const MEDAL_STYLES: Record<
  MedalTier,
  { bgColor: string; ringColor: string; textColor: string; fillColor: string }
> = {
  bronze: {
    bgColor: 'bg-[#8B5E3C]',
    ringColor: 'ring-[#CD7F32]',
    textColor: 'text-[#CD7F32]',
    fillColor: '#CD7F32',
  },
  silver: {
    bgColor: 'bg-[#6B7280]',
    ringColor: 'ring-[#C0C0C0]',
    textColor: 'text-[#6B7280]',
    fillColor: '#C0C0C0',
  },
  gold: {
    bgColor: 'bg-[#B8860B]',
    ringColor: 'ring-[#FFD700]',
    textColor: 'text-[#B8860B]',
    fillColor: '#FFD700',
  },
}

/**
 * Filled stars (out of 3) for a live accuracy reading.
 * The first star fills as soon as a score exists so the meter visibly
 * grows, then mirrors the Trail Map medal tiers.
 */
export const starsForAccuracy = (accuracy: number | null): number => {
  if (accuracy === null || accuracy <= 0) return 0
  if (accuracy >= MEDAL_THRESHOLDS.gold) return 3
  if (accuracy >= MEDAL_THRESHOLDS.silver) return 2
  return 1
}
