import React from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle } from 'lucide-react'

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
  attempts?: number
  disabled?: boolean
  className?: string
}

/**
 * Reusable 2x2 option grid for game activities.
 * Supports text tiles (syllables, words) and image tiles (vocabulary).
 * Shows green/red feedback on selection. Minimum 64px touch targets.
 */
export const OptionGrid: React.FC<OptionGridProps> = ({
  options,
  selectedId,
  correctId,
  onSelect,
  type = 'text',
  attempts = 0,
  disabled = false,
  className,
}) => {
  const showHint = attempts >= 3 && correctId

  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {options.map((option) => {
        const isSelected = selectedId === option.id
        const isCorrect = correctId === option.id
        const isWrong = isSelected && !isCorrect
        const isHint = showHint && isCorrect && !isSelected

        return (
          <button
            key={option.id}
            onClick={() => !disabled && onSelect(option.id)}
            disabled={disabled || (!!selectedId && !!correctId)}
            aria-label={option.label ?? `Opsyon ${option.id}`}
            className={cn(
              // Base - minimum 64px touch targets
              'relative min-h-[72px] lg:min-h-[88px] rounded-2xl border-2',
              'flex flex-col items-center justify-center gap-2 p-3',
              'transition-all duration-200 font-heading font-bold text-lg',
              'shadow-md active:scale-95 select-none',

              // Default state
              !isSelected && !isHint && 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40 hover:scale-105',

              // Correct selection
              isSelected && isCorrect && 'bg-green-500/30 border-green-400 text-green-200 scale-105 shadow-green-900/50',

              // Wrong selection — shake animation via CSS class
              isWrong && 'bg-red-500/30 border-red-400 text-red-200 animate-shake',

              // Hint indicator (3+ wrong attempts)
              isHint && 'bg-pamana-gold/20 border-pamana-gold text-pamana-gold animate-pulse',

              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            {/* Image mode */}
            {type === 'image' && option.imageUrl && (
              <img
                src={option.imageUrl}
                alt={option.label ?? 'opsyon'}
                className="w-14 h-14 lg:w-20 lg:h-20 object-contain rounded-xl"
                draggable={false}
              />
            )}

            {/* Text mode */}
            {type === 'text' && (
              <span className="tracking-wider uppercase text-2xl lg:text-3xl">
                {option.label}
              </span>
            )}

            {/* Feedback icon */}
            {isSelected && (
              <div className="absolute top-2 right-2">
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
              </div>
            )}

            {/* Hint star */}
            {isHint && (
              <div className="absolute top-2 right-2">
                <span className="text-xs font-bold text-pamana-gold">💡</span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
