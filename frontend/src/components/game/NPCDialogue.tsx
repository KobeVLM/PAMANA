import React from 'react'
import { Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NPCDialogueProps {
  npc: 'lolo' | 'lola'
  line: string
  audioUrl?: string
  onPlayAudio?: () => void
  className?: string
}

/**
 * NPC dialogue bubble component.
 * Shows Lolo or Lola sprite with an animated speech bubble.
 * Used for instructions across all game modules.
 */
export const NPCDialogue: React.FC<NPCDialogueProps> = ({
  npc,
  line,
  audioUrl,
  onPlayAudio,
  className,
}) => {
  const imgSrc = npc === 'lolo' ? '/images/Lolo_A.png' : '/images/Lola_A.png'
  const name = npc === 'lolo' ? 'Lolo' : 'Lola'
  const gradientColor = npc === 'lolo'
    ? 'from-amber-400 to-orange-500'
    : 'from-amber-400 to-orange-500'

  return (
    <div className={cn('flex items-start gap-4', className)}>
      {/* NPC Avatar */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1">
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center overflow-hidden',
            `bg-gradient-to-br ${gradientColor}`,
            'shadow-lg animate-float p-1 border-2 border-white/50'
          )}
        >
          <img src={imgSrc} alt={name} className="w-full h-full object-cover object-top rounded-full scale-125" />
        </div>
        <span className="text-sm font-bold text-pamana-gold">{name}</span>
      </div>

      {/* Speech Bubble */}
      <div className="relative flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl rounded-tl-sm p-4 shadow-lg">
        {/* Triangle pointer */}
        <div className="absolute -left-2 top-4 w-0 h-0 border-y-4 border-y-transparent border-r-8 border-r-white/10" />

        <div className="flex items-start justify-between gap-3">
          <p className="text-white text-sm leading-relaxed flex-1">{line}</p>
          {(audioUrl || onPlayAudio) && (
            <button
              onClick={onPlayAudio}
              aria-label="Pakinggan ang tagubilin"
              className="flex-shrink-0 w-8 h-8 rounded-full bg-pamana-gold/20 border border-pamana-gold/40 flex items-center justify-center text-pamana-gold hover:bg-pamana-gold/30 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
