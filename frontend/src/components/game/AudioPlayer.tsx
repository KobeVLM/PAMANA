import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Volume2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

// Global AudioContext singleton to ensure it stays unlocked
let globalAudioContext: AudioContext | null = null;
function getAudioContext() {
  if (!globalAudioContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    globalAudioContext = new AudioContextClass();
  }
  if (globalAudioContext.state === 'suspended') {
    globalAudioContext.resume().catch(() => {});
  }
  return globalAudioContext;
}

// Unlock audio context on first click anywhere
if (typeof window !== 'undefined') {
  window.addEventListener('click', () => {
    getAudioContext();
  }, { once: true });
}

interface AudioPlayerProps {
  audioUrl: string
  autoPlay?: boolean
  className?: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  autoPlay = false,
  className,
  label = 'Pakinggan',
  size = 'md',
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  
  const bufferRef = useRef<AudioBuffer | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)

  const loadAudio = useCallback(async () => {
    try {
      const ctx = getAudioContext()
      const response = await fetch(audioUrl)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
      bufferRef.current = audioBuffer
      setIsLoaded(true)
      setHasError(false)
      return true
    } catch (err) {
      console.warn('Failed to load audio for Web Audio API:', err)
      setHasError(true)
      return false
    }
  }, [audioUrl])

  const play = useCallback(async () => {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    
    // Stop any currently playing node
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop()
        sourceNodeRef.current.disconnect()
      } catch (e) { /* ignore */ }
    }

    if (!bufferRef.current) {
      const loaded = await loadAudio()
      if (!loaded) return
    }

    try {
      const source = ctx.createBufferSource()
      source.buffer = bufferRef.current!
      source.connect(ctx.destination)
      source.onended = () => setIsPlaying(false)
      source.start(0)
      sourceNodeRef.current = source
      setIsPlaying(true)
      setHasError(false)
    } catch (err) {
      console.warn('Playback failed:', err)
      setHasError(true)
    }
  }, [loadAudio])

  useEffect(() => {
    // Stop playing if unmounted or url changes
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop()
        sourceNodeRef.current.disconnect()
      } catch (e) { /* ignore */ }
      setIsPlaying(false)
    }

    setIsLoaded(false)
    bufferRef.current = null

    if (autoPlay) {
      // Small timeout to allow render to complete
      setTimeout(() => {
        play()
      }, 100)
    } else {
      // Just preload it
      loadAudio()
    }

    return () => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop()
          sourceNodeRef.current.disconnect()
        } catch (e) { /* ignore */ }
      }
    }
  }, [audioUrl, autoPlay, play, loadAudio])

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
      onClick={play}
      aria-label={label}
      className={cn(
        'rounded-full flex flex-col items-center justify-center gap-1',
        'bg-gradient-to-br from-pamana-gold to-pamana-amber',
        'text-white shadow-lg transition-all duration-200',
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
  )
}
