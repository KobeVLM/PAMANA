import React, { useCallback, useEffect, useRef } from 'react'
import { Volume2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAudio } from '@/contexts/AudioContext'
import { useReplayTelemetry } from '@/hooks/useReplayTelemetry'

interface AudioPlayerProps {
  audioUrl: string
  autoPlay?: boolean
  className?: string
  label?: string
  /** English label appended for screen readers. */
  labelEn?: string
  /** Spoken via speechSynthesis if the clip cannot be loaded. */
  fallbackText?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Reusable speaker button. Playback goes through the shared voice channel, so
 * tapping it always stops any instruction that is currently speaking.
 * Auto-plays on mount if autoPlay=true.
 * Shows a retry icon when the clip cannot be played.
 */
export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  autoPlay = false,
  className,
  label = 'Pakinggan',
  labelEn,
  fallbackText,
  size = 'md',
}) => {
  const { playAudio, isAudioPlaying, currentAudioUrl } = useAudio()
  const { trackReplay } = useReplayTelemetry()
  const [hasError, setHasError] = React.useState(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const play = useCallback(async () => {
    if (!audioUrl) {
      setHasError(true)
      return
    }
    setHasError(false)
    const result = await playAudio(audioUrl, { fallbackText })
    if (!isMountedRef.current) return
    if (result === 'error') setHasError(true)
  }, [audioUrl, fallbackText, playAudio])

  useEffect(() => {
    if (autoPlay && audioUrl) {
      void play()
    }
  }, [autoPlay, audioUrl, play])

  // Only taps are replays; the initial auto-play is not a learner request.
  const handleClick = () => {
    trackReplay({
      itemType: 'target_audio',
      itemKey: audioUrl,
      source: 'target',
    })
    void play()
  }

  const isSpeaking = isAudioPlaying && currentAudioUrl === audioUrl

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-base',
    lg: 'w-20 h-20 text-lg',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={labelEn ? `${label} (${labelEn})` : label}
      data-speaking={isSpeaking ? 'true' : undefined}
      className={cn(
        'flex flex-col items-center justify-center gap-1 rounded-full',
        'border-4 border-white bg-gradient-to-br from-pamana-gold to-pamana-amber',
        'text-white shadow-[0_6px_0_rgba(0,0,0,0.15)] transition-all duration-200',
        'hover:scale-105 active:scale-95',
        'animate-pulse-glow',
        isSpeaking && 'ring-4 ring-white/90',
        sizeClasses[size],
        className
      )}
    >
      {hasError ? (
        <RefreshCw className={iconSizes[size]} aria-hidden="true" />
      ) : (
        <Volume2 className={iconSizes[size]} aria-hidden="true" />
      )}
    </button>
  )
}
