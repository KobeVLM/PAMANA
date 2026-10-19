import React, { useEffect, useRef, useCallback } from 'react'
import { Volume2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
  audioUrl: string
  autoPlay?: boolean
  className?: string
  label?: string
  /** English label appended for screen readers. */
  labelEn?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Reusable audio player component using HTML5 Audio.
 * Accepts a local static asset URL from Spring Boot.
 * Auto-plays on mount if autoPlay=true.
 * Shows retry button on playback failure.
 */
export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  autoPlay = false,
  className,
  label = 'Pakinggan',
  labelEn,
  size = 'md',
}) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [hasError, setHasError] = React.useState(false)
  const [isPlaying, setIsPlaying] = React.useState(false)

  const playFallbackBeep = (err: unknown) => {
    console.error('Audio playback failed!', err);
  }

  const play = useCallback(() => {
    if (!audioRef.current) return
    setHasError(false)
    audioRef.current.currentTime = 0
    audioRef.current.play().catch((err) => {
      playFallbackBeep(err)
      setHasError(true)
    })
  }, [])

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play().catch((err) => {
        playFallbackBeep(err)
        setHasError(true)
      })
    }
  }, [audioUrl, autoPlay])
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
    <>
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        autoPlay={autoPlay}
        onPlay={() => setIsPlaying(true)} 
        onEnded={() => setIsPlaying(false)}
        onError={() => { setIsPlaying(false); setHasError(true); }} 
      />
      <button
        onClick={play}
        aria-label={labelEn ? `${label} (${labelEn})` : label}
        className={cn(
          'rounded-full flex flex-col items-center justify-center gap-1',
          'border-4 border-white bg-gradient-to-br from-pamana-gold to-pamana-amber',
          'text-white shadow-[0_6px_0_rgba(0,0,0,0.15)] transition-all duration-200',
          'hover:scale-105 active:scale-95',
          isPlaying && 'animate-pulse-glow',
          sizeClasses[size],
          className
        )}
      >
        {hasError ? (
          <RefreshCw className={iconSizes[size]} />
        ) : (
          <Volume2 className={iconSizes[size]} />
        )}
      </button>
    </>
  )
}

