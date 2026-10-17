import React, { useEffect, useId, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { Mascot } from './Mascot'
import { cn } from '@/lib/utils'
import { useAudio } from '@/contexts/AudioContext'
import { useLanguage } from '@/contexts/LanguageContext'

interface NPCDialogueProps {
  npc: 'lolo' | 'lola'
  line: string
  /** English translation, revealed by the EN chip (when English is enabled). */
  lineEn?: string
  audioUrl?: string
  autoPlay?: boolean
  /** Increment to make the NPC cheer on a correct answer. */
  celebrate?: number
  /** The current question's identity; changing it clears an in-flight cheer. */
  resetKey?: unknown
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
  celebrate = 0,
  resetKey,
  onPlayAudio,
  onAudioEnd,
  className,
}) => {
  const { playAudio } = useAudio()
  
  const name = npc === 'lolo' ? 'Lolo' : 'Lola'
  const mascot = npc === 'lolo'
    ? { directions: '/images/grandpa-directions.webp', reactions: '/images/grandpa-reactions.webp' }
    : { directions: '/images/granny-directions.webp', reactions: '/images/granny-reactions.webp' }

  const { showEnglish } = useLanguage()
  const [showEn, setShowEn] = useState(false)
  const enId = useId()

  useEffect(() => {
    setShowEn(false)
  }, [line])

  const canToggleEn = showEnglish && Boolean(lineEn)

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
    <div className={cn('flex items-start gap-2.5', className)}>
      {/* NPC Avatar */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1">
        <Mascot
          directions={mascot.directions}
          reactions={mascot.reactions}
          size={112}
          label={name}
          celebrate={celebrate}
          resetKey={resetKey}
        />
        <span className="text-sm font-bold text-pamana-gold">{name}</span>
      </div>

      {/* Speech Bubble */}
      <div className="relative w-fit min-w-0 max-w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl rounded-tl-sm p-2.5 shadow-lg">
        {/* Triangle pointer */}
        <div className="absolute -left-2 top-4 w-0 h-0 border-y-4 border-y-transparent border-r-8 border-r-white/10" />

        <div className="flex items-start justify-between gap-3">
          <p className="flex-1 text-sm leading-relaxed text-white">{line}</p>
          <div className="flex shrink-0 flex-col items-center gap-1">
            {(audioUrl || onPlayAudio) && (
              <button
                onClick={handlePlay}
                aria-label="Pakinggan ang tagubilin"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-pamana-gold/40 bg-pamana-gold/20 text-pamana-gold transition-colors hover:bg-pamana-gold/30"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
            {canToggleEn && (
              <button
                type="button"
                onClick={() => setShowEn((value) => !value)}
                aria-expanded={showEn}
                aria-controls={enId}
                aria-label={
                  showEn
                    ? 'Itago ang Ingles (Hide English)'
                    : 'Ipakita ang Ingles (Show English)'
                }
                className="rounded-full border border-pamana-gold/40 px-1.5 py-0.5 text-[10px] font-bold text-pamana-gold transition-colors hover:bg-pamana-gold/30"
              >
                EN
              </button>
            )}
          </div>
        </div>

        {canToggleEn && showEn && (
          <p
            id={enId}
            lang="en"
            className="mt-1 text-xs leading-snug text-green-100/80"
          >
            {lineEn}
          </p>
        )}
      </div>
    </div>
  )
}
