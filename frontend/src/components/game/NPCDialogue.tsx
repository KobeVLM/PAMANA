import React, { useEffect, useRef } from 'react'
import { Volume2 } from 'lucide-react'
import { Mascot } from './Mascot'
import { BilingualText } from '@/components/common/BilingualText'
import { cn } from '@/lib/utils'
import { useAudio } from '@/contexts/AudioContext'

interface NPCDialogueProps {
  npc: 'lolo' | 'lola'
  line: string
  /** English translation shown under the Filipino line. */
  lineEn?: string
  audioUrl?: string
  autoPlay?: boolean
  onPlayAudio?: () => void
  onAudioEnd?: () => void
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
  lineEn,
  audioUrl,
  autoPlay = true,
  onPlayAudio,
  onAudioEnd,
  className,
}) => {
  const { playAudio } = useAudio()
  
  const name = npc === 'lolo' ? 'Lolo' : 'Lola'
  const mascot = npc === 'lolo'
    ? { directions: '/images/grandpa-directions.webp', reactions: '/images/grandpa-reactions.webp' }
    : { directions: '/images/granny-directions.webp', reactions: '/images/granny-reactions.webp' }

  const onAudioEndRef = useRef(onAudioEnd)
  useEffect(() => {
    onAudioEndRef.current = onAudioEnd
  }, [onAudioEnd])

  const lastPlayedUrlRef = useRef<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    if (audioUrl && autoPlay && lastPlayedUrlRef.current !== audioUrl) {
      lastPlayedUrlRef.current = audioUrl
      playAudio(audioUrl, true)
        .catch(console.error)
        .finally(() => {
          if (isCurrent) {
            onAudioEndRef.current?.()
          }
        })
    }
    return () => {
      isCurrent = false
    }
  }, [audioUrl, autoPlay, playAudio])

  const handlePlay = () => {
    if (audioUrl) {
      playAudio(audioUrl, true)
        .catch(console.error)
        .finally(() => {
          onAudioEndRef.current?.()
        })
    } else if (onPlayAudio) {
      onPlayAudio()
    }
  }

  return (
    <div className={cn('flex items-start gap-4', className)}>
      {/* NPC Avatar */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1">
        <Mascot
          directions={mascot.directions}
          reactions={mascot.reactions}
          size={112}
          label={name}
        />
        <span className="text-sm font-bold text-pamana-gold">{name}</span>
      </div>

      {/* Speech Bubble */}
      <div className="relative flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl rounded-tl-sm p-4 shadow-lg">
        {/* Triangle pointer */}
        <div className="absolute -left-2 top-4 w-0 h-0 border-y-4 border-y-transparent border-r-8 border-r-white/10" />

        <div className="flex items-start justify-between gap-3">
          <BilingualText
            fil={line}
            en={lineEn ?? ''}
            className="flex-1"
            filClassName="text-sm leading-relaxed text-white"
            enClassName="text-green-100/80"
          />
          {(audioUrl || onPlayAudio) && (
            <button
              onClick={handlePlay}
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
