import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useLocation } from 'react-router-dom'

export type PlaybackResult = 'ended' | 'error' | 'interrupted'

export interface PlayAudioOptions {
  /** 0–1, defaults to 1. */
  volume?: number
  /** Spoken via speechSynthesis when the clip cannot be loaded. */
  fallbackText?: string
}

interface AudioContextType {
  isAudioPlaying: boolean
  playAudio: (url: string, options?: PlayAudioOptions) => Promise<PlaybackResult>
  stopAudio: () => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

const clampVolume = (value: number) => Math.min(1, Math.max(0, value))

const getSpeechSynthesis = () =>
  typeof window !== 'undefined' ? window.speechSynthesis : undefined

/**
 * Word and syllable clips can be described by their file name
 * (`/audio/words/laro.mp3` → "laro"). NPC and sentence clips need explicit
 * fallback text because their file names are not speakable.
 */
function deriveFallbackText(url: string): string | undefined {
  const file = url.split('?')[0]?.split('/').pop()
  if (!file || !file.toLowerCase().endsWith('.mp3')) return undefined
  const base = decodeURIComponent(file.slice(0, -4)).replace(/^sentence_/, '')
  if (!base || /[_\-\d]/.test(base)) return undefined
  return base
}

/**
 * Global voice channel. Instructions, word/syllable clips and sound effects all
 * share one player, so starting a new clip always stops the previous one.
 * This prevents overlapping voices and makes every tap respond immediately.
 */
export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const pendingRef = useRef<((result: PlaybackResult) => void) | null>(null)
  const tokenRef = useRef(0)
  const location = useLocation()

  const ensureAudio = useCallback((): HTMLAudioElement | null => {
    if (typeof Audio === 'undefined') return null
    if (!audioRef.current) {
      const audio = new Audio()
      audio.preload = 'auto'
      audioRef.current = audio
    }
    return audioRef.current
  }, [])

  const resolvePending = useCallback((result: PlaybackResult) => {
    const resolve = pendingRef.current
    pendingRef.current = null
    if (resolve) resolve(result)
  }, [])

  /** Stops the active clip/speech and resolves its promise as interrupted. */
  const haltPlayback = useCallback(() => {
    tokenRef.current += 1

    const audio = audioRef.current
    if (audio) {
      audio.onended = null
      audio.onerror = null
      audio.pause()
      audio.currentTime = 0
    }

    getSpeechSynthesis()?.cancel()
    resolvePending('interrupted')
    setIsAudioPlaying(false)
  }, [resolvePending])

  const stopAudio = useCallback(() => {
    haltPlayback()
  }, [haltPlayback])

  const finish = useCallback(
    (
      id: number,
      result: PlaybackResult,
      resolve: (result: PlaybackResult) => void
    ) => {
      if (id !== tokenRef.current) return
      pendingRef.current = null
      setIsAudioPlaying(false)
      resolve(result)
    },
    []
  )

  const speak = useCallback(
    (
      id: number,
      text: string,
      options: PlayAudioOptions,
      resolve: (result: PlaybackResult) => void
    ) => {
      const synth = getSpeechSynthesis()
      if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
        finish(id, 'error', resolve)
        return
      }

      synth.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'fil-PH'
      utterance.rate = 0.9
      utterance.volume = clampVolume(options.volume ?? 1)
      const filipinoVoice = synth
        .getVoices()
        .find((voice) => /^(fil|tl)(-|$)/i.test(voice.lang))
      if (filipinoVoice) utterance.voice = filipinoVoice

      utterance.onend = () => finish(id, 'ended', resolve)
      utterance.onerror = () => finish(id, 'error', resolve)

      setIsAudioPlaying(true)
      synth.speak(utterance)
    },
    [finish]
  )

  const playAudio = useCallback(
    (url: string, options: PlayAudioOptions = {}): Promise<PlaybackResult> => {
      return new Promise<PlaybackResult>((resolve) => {
        haltPlayback()
        const id = tokenRef.current + 1
        tokenRef.current = id

        const fallbackText = options.fallbackText ?? deriveFallbackText(url)
        if (!url) {
          if (fallbackText) {
            pendingRef.current = resolve
            speak(id, fallbackText, options, resolve)
          } else {
            resolve('error')
          }
          return
        }

        const audio = ensureAudio()
        if (!audio) {
          if (fallbackText) {
            pendingRef.current = resolve
            speak(id, fallbackText, options, resolve)
          } else {
            resolve('error')
          }
          return
        }

        pendingRef.current = resolve
        setIsAudioPlaying(true)
        audio.volume = clampVolume(options.volume ?? 1)

        audio.onended = () => {
          if (id !== tokenRef.current) return
          audio.onended = null
          audio.onerror = null
          finish(id, 'ended', resolve)
        }

        audio.onerror = () => {
          if (id !== tokenRef.current) return
          audio.onended = null
          audio.onerror = null
          if (fallbackText) {
            const speechId = tokenRef.current + 1
            tokenRef.current = speechId
            speak(speechId, fallbackText, options, resolve)
          } else {
            finish(id, 'error', resolve)
          }
        }

        audio.src = url
        audio.currentTime = 0
        void audio.play().catch(() => {
          if (id !== tokenRef.current) return
          audio.onended = null
          audio.onerror = null
          finish(id, 'error', resolve)
        })
      })
    },
    [ensureAudio, finish, haltPlayback, speak]
  )

  // Stop voice audio when navigating between pages.
  useEffect(() => {
    stopAudio()
  }, [location.pathname, stopAudio])

  // Stop when the tab is hidden or the page is being left.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) stopAudio()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pagehide', handleVisibility)
    window.addEventListener('beforeunload', handleVisibility)

    return () => {
      stopAudio()
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pagehide', handleVisibility)
      window.removeEventListener('beforeunload', handleVisibility)
    }
  }, [stopAudio])

  return (
    <AudioContext.Provider value={{ isAudioPlaying, playAudio, stopAudio }}>
      {children}
    </AudioContext.Provider>
  )
}

export const useAudio = () => {
  const context = useContext(AudioContext)
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}
