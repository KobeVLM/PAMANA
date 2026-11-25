import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { Mascot } from './Mascot'
import { ReplayButton } from './ReplayButton'
import { cn } from '@/lib/utils'
import { useAudio } from '@/contexts/AudioContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useReplayTelemetry } from '@/hooks/useReplayTelemetry'

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
  moduleNumber?: number // 👈 Added moduleNumber
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
  moduleNumber, // 👈 Destructured here
}) => {
  const { playAudio, isAudioPlaying, currentAudioUrl } = useAudio()
  const { trackReplay } = useReplayTelemetry()

  // The bubble lights up only while this exact clip is the active voice, so a
  // different clip (target word, sound effect) cannot falsely highlight it.
  const isSpeaking = Boolean(audioUrl) && isAudioPlaying && currentAudioUrl === audioUrl

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
    trackReplay({
      itemType: 'npc_instruction',
      itemKey: audioUrl ?? line,
      moduleNumber,
      source: 'npc',
    })
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
          moduleNumber={moduleNumber} // 👈 Passed down here
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

      {/* Speech bubble + prominent replay control, centred at the activity top */}
      <div className="flex min-w-0 flex-col items-center gap-1.5">
        {(audioUrl || onPlayAudio) && (
          <ReplayButton onReplay={handlePlay} isSpeaking={isSpeaking} />
        )}

        <div
          data-speaking={isSpeaking ? 'true' : undefined}
          className={cn(
            'relative mt-1 w-fit min-w-0 max-w-sm rounded-2xl rounded-tl-sm border-[3px] p-3 shadow-[0_5px_0_rgba(90,62,43,0.3)] sm:max-w-md md:max-w-lg',
            isSpeaking
              ? 'border-[#F6B333] bg-white ring-4 ring-[#F6B333]/70'
              : 'border-[#D4A373] bg-[#FFF8E7]'
          )}
        >
          {/* Custom Triangle pointer */}
          <div
            className={cn(
              'absolute -left-[13px] top-4 h-5 w-5 rotate-45 rounded-sm border-b-[3px] border-l-[3px]',
              isSpeaking ? 'border-[#F6B333] bg-white' : 'border-[#D4A373] bg-[#FFF8E7]'
            )}
          />

          {isSpeaking && (
            <p className="relative z-10 mb-1 inline-flex items-center gap-1 rounded-full bg-[#F6B333] px-2 py-0.5 text-xs font-black text-white">
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
              Nagsasalita / Speaking
            </p>
          )}

          <div className="relative z-10 flex items-start justify-between gap-3">
            {/* 32px == 24pt, the minimum readable size for read-along text. */}
            <p className="flex-1 text-[32px] font-black leading-[1.1] text-[#2B1A0F]">
              {line}
            </p>

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
                className="shrink-0 rounded-full border-[2px] border-[#C28A1D] bg-[#F6B333] px-2 py-0.5 text-[10px] font-black text-white shadow-[0_2px_0_#C28A1D] hover:bg-[#F9C35B] active:translate-y-0.5 active:shadow-none transition-all"
              >
                EN
              </button>
            )}
          </div>

          {canToggleEn && showEn && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50">
              <p
                id={enId}
                lang="en"
                className="border-[3px] border-[#D4A373] bg-[#FFF8E7] p-3 shadow-[0_5px_0_rgba(90,62,43,0.3)] rounded-xl text-xs md:text-sm leading-snug text-[#6B4A2D] font-bold"
              >
                {lineEn}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}