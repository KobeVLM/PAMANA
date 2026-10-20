import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { HINT_AFTER_ATTEMPTS } from '@/components/game/constants'
import { CheckCircle2, Lightbulb, RefreshCw } from 'lucide-react'

interface OptionItem {
  id: string
  label?: string
  imageUrl?: string
  audioUrl?: string
}

interface OptionGridProps {
  options: OptionItem[]
  selectedId?: string | null
  correctId?: string | null
  onSelect: (id: string) => void
  type?: 'text' | 'image'
  /** Visual weight of the tiles (image mode benefits from larger tiles). */
  size?: 'md' | 'lg'
  /** Show the option label under images. */
  showLabels?: boolean
  /** Fade the non-answer tiles once the learner has answered. */
  dimUnselected?: boolean
  attempts?: number
  disabled?: boolean
  className?: string
}

interface OptionTileProps {
  option: OptionItem
  type: 'text' | 'image'
  size: 'md' | 'lg'
  showLabels: boolean
  dimUnselected: boolean
  isSelected: boolean
  isCorrect: boolean
  isWrong: boolean
  isHint: boolean
  /** Lock every tile once an answer has been submitted. */
  lockAll: boolean
  disabled: boolean
  onSelect: (id: string) => void
}

const OptionTile: React.FC<OptionTileProps> = ({
  option,
  type,
  size,
  showLabels,
  dimUnselected,
  isSelected,
  isCorrect,
  isWrong,
  isHint,
  lockAll,
  disabled,
  onSelect,
}) => {
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setImageFailed(false)
  }, [option.imageUrl])

  const isBig = size === 'lg'
  const isDimmed =
    dimUnselected && !isSelected && !isCorrect && !isHint

  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(option.id)}
      disabled={disabled || lockAll}
      aria-label={option.label ?? `Opsyon ${option.id}`}
      className={cn(
        'game-tile relative flex flex-col items-center justify-center gap-2 rounded-2xl',
        'font-heading font-bold text-lg shadow-md transition-all duration-200 select-none active:scale-95',
        isBig ? 'min-h-[140px] p-3 sm:min-h-[170px] sm:p-4' : 'min-h-[56px] p-2.5 lg:min-h-[64px]',

        !isSelected &&
          !isHint &&
          'hover:scale-105 hover:bg-[#f4f9f0]',

        isSelected && isCorrect &&
          'border-green-400 bg-[#e7f6e7] text-[#1B5E20] scale-105',

        isWrong && 'animate-wiggle border-red-400/70 bg-[#fdeaea] text-[#8f1d1d]',

        isHint && 'animate-pulse border-pamana-gold bg-[#fff7db] text-[#7a5200]',

        isDimmed && 'border-white/60 bg-white/40 opacity-65',

        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      {type === 'image' && option.imageUrl && !imageFailed && (
        <img
          src={option.imageUrl}
          alt={option.label ?? 'opsyon'}
          onError={() => setImageFailed(true)}
          draggable={false}
          className={cn(
            'object-contain',
            isBig ? 'h-24 w-24 sm:h-28 sm:w-28' : 'h-14 w-14 lg:h-20 lg:w-20'
          )}
        />
      )}

      {type === 'image' && (!option.imageUrl || imageFailed) && (
        <div
          className={cn(
            'flex items-center justify-center rounded-xl border-2 border-[#d5e5d0] bg-[#f4f9f0] p-2 text-center text-[#2b5c3b]/80',
            isBig ? 'h-24 w-24 text-lg sm:h-28 sm:w-28' : 'h-14 w-14 text-sm lg:h-20 lg:w-20'
          )}
        >
          {option.label ?? 'Larawan'}
        </div>
      )}

      {type === 'image' && showLabels && option.label && (
        <span className="text-xs font-semibold tracking-wide text-[#3f7d52] sm:text-sm">
          {option.label}
        </span>
      )}

      {type === 'text' && (
        <span className="text-2xl uppercase tracking-wider lg:text-3xl">
          {option.label}
        </span>
      )}

      {isSelected && (
        <div className="absolute right-2 top-2" aria-hidden="true">
          {isCorrect ? (
            <CheckCircle2 className="h-5 w-5 text-[#2E7D32]" />
          ) : (
            <RefreshCw className="h-5 w-5 text-[#c62828]" />
          )}
        </div>
      )}

      {isHint && (
        <div className="absolute right-2 top-2" aria-hidden="true">
          <Lightbulb className="h-5 w-5 text-[#D4A017]" />
        </div>
      )}
    </button>
  )
}

/**
 * Reusable 2x2 option grid for game activities.
 * Supports text tiles (syllables, words) and image tiles (vocabulary),
 * with green/amber feedback, hint highlighting and accessible labelling.
 */
export const OptionGrid: React.FC<OptionGridProps> = ({
  options,
  selectedId,
  correctId,
  onSelect,
  type = 'text',
  size = 'md',
  showLabels = false,
  dimUnselected = false,
  attempts = 0,
  disabled = false,
  className,
}) => {
  const showHint = attempts >= HINT_AFTER_ATTEMPTS && correctId
  const lockAll = Boolean(selectedId && correctId)

  return (
    <div
      role="group"
      aria-label="Mga pagpipilian (Choices)"
      className={cn(
        'grid grid-cols-2',
        size === 'lg' ? 'gap-4' : 'gap-3',
        className
      )}
    >
      {options.map((option) => {
        const isSelected = selectedId === option.id
        const isCorrect = correctId === option.id
        const isWrong = isSelected && !isCorrect
        const isHint = Boolean(showHint && isCorrect && !isSelected)

        return (
          <OptionTile
            key={option.id}
            option={option}
            type={type}
            size={size}
            showLabels={showLabels}
            dimUnselected={dimUnselected}
            isSelected={isSelected}
            isCorrect={isCorrect}
            isWrong={isWrong}
            isHint={isHint}
            lockAll={lockAll}
            disabled={disabled}
            onSelect={onSelect}
          />
        )
      })}
    </div>
  )
}
