import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { Mascot } from './Mascot'
import { cn } from '@/lib/utils'
import { useAudio } from '@/contexts/AudioContext'
import { useLanguage } from '@/contexts/LanguageContext'

interface NPCDialogueProps {
  npc: 'lolo' | 'lola'
  line: string
  lineEn?: string
  audioUrl?: string
  autoPlay?: boolean
  celebrate?: number
  resetKey?: unknown
  onPlayAudio?: () => void
  onAudioEnd?: () => void
  className?: string
}

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
    ? { directions: '/characters/Lolo_directions.png', reactions: '/characters/Lolo_expressions.png' }
    : { directions: '/characters/Lola_directions.png', reactions: '/characters/Lola_expressions.png' }

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
  const playbackTokenRef = useRef(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const playInstruction = useCallback(
    (url: string) => {
      const token = playbackTokenRef.current + 1
      playbackTokenRef.current = token
      void playAudio(url, { fallbackText: line }).then((result) => {
        if (token !== playbackTokenRef.current || !isMountedRef.current) return
        if (result !== 'interrupted') onAudioEndRef.current?.()
      })
    },
    [line, playAudio]
  )

  useEffect(() => {
    if (!audioUrl || !autoPlay || lastPlayedUrlRef.current === audioUrl) return
    lastPlayedUrlRef.current = audioUrl
    playInstruction(audioUrl)
  }, [audioUrl, autoPlay, playInstruction])

  const handlePlay = () => {
    if (audioUrl) {
      lastPlayedUrlRef.current = audioUrl
      playInstruction(audioUrl)
    } else if (onPlayAudio) {
      onPlayAudio()
    }
  }

  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      {/* NPC Avatar */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1 z-10">
        <Mascot
          directions={mascot.directions}
          reactions={mascot.reactions}
          size={100}
          label={name}
          celebrate={celebrate}
          resetKey={resetKey}
        />
        {/* UPDATED NAME STYLE HERE */}
        <span 
          className="text-lg md:text-xl font-heading font-black text-white drop-shadow-sm mt-1"
          style={{ 
            WebkitTextStroke: '1.5px black',
            paintOrder: 'stroke fill'
          }}
        >
          {name}
        </span>
      </div>

      {/* Speech Bubble */}
      <div className="relative w-fit min-w-0 max-w-sm sm:max-w-md md:max-w-lg rounded-2xl rounded-tl-sm border-[3px] border-[#D4A373] bg-[#FFF8E7] p-3 shadow-[0_5px_0_rgba(90,62,43,0.3)] mt-1">
        
        {/* Custom Triangle pointer */}
        <div className="absolute -left-[13px] top-4 h-5 w-5 rotate-45 border-b-[3px] border-l-[3px] border-[#D4A373] bg-[#FFF8E7] rounded-sm" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <p className="flex-1 text-sm md:text-base leading-snug font-bold text-[#4A2F1D]">
            {line}
          </p>
          
          <div className="flex shrink-0 flex-col items-center gap-1.5 mt-0.5">
            {(audioUrl || onPlayAudio) && (
              <button
                onClick={handlePlay}
                aria-label="Pakinggan ang tagubilin"
                className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-[#C28A1D] bg-[#F6B333] text-white shadow-[0_2px_0_#C28A1D] hover:bg-[#F9C35B] active:translate-y-0.5 active:shadow-none transition-all"
              >
                <Volume2 className="w-4 h-4 drop-shadow-md" strokeWidth={3} />
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
                className="rounded-full border-[2px] border-[#C28A1D] bg-[#F6B333] px-2 py-0.5 text-[10px] font-black text-white shadow-[0_2px_0_#C28A1D] hover:bg-[#F9C35B] active:translate-y-0.5 active:shadow-none transition-all"
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
            className="mt-2 border-t-[2px] border-dashed border-[#D4A373]/50 pt-1.5 text-xs md:text-sm leading-snug text-[#6B4A2D] font-medium relative z-10"
          >
            {lineEn}
          </p>
        )}
      </div>
    </div>
  )
}