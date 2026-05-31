import React, { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import bgMusicUrl from '@/components/music/bgmusic.mp3'

export const BGMController: React.FC = () => {
  const location = useLocation()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(bgMusicUrl)
      audioRef.current.loop = true
      audioRef.current.volume = 0.5 // Adjust volume so it's pleasant
    }

    const checkAndPlay = async () => {
      if (!audioRef.current) return

      const isMusicEnabled = localStorage.getItem('pamana_bgm') !== 'false' // default true
      
      // Play music on trail, klase, leaderboard, settings, and dashboards
      // BUT specifically stop it inside modules (the actual game levels)
      const playPaths = ['/trail', '/klase', '/leaderboard', '/settings', '/dashboard']
      const shouldPlay = playPaths.some(p => location.pathname.startsWith(p))

      if (isMusicEnabled && shouldPlay) {
        try {
          if (audioRef.current.paused) {
            await audioRef.current.play()
          }
        } catch (e) {
          // Autoplay policy might block it until user interacts, but usually
          // by the time they reach dashboard they have interacted (logged in).
          console.warn('Audio auto-play prevented', e)
        }
      } else {
        if (!audioRef.current.paused) {
          audioRef.current.pause()
        }
      }
    }

    checkAndPlay()

    // Handle browser autoplay policies by trying to play after user interaction
    const handleInteraction = () => {
      const isMusicEnabled = localStorage.getItem('pamana_bgm') !== 'false'
      const playPaths = ['/trail', '/klase', '/leaderboard', '/settings', '/dashboard']
      const shouldPlay = playPaths.some(p => location.pathname.startsWith(p))
      
      if (isMusicEnabled && shouldPlay && audioRef.current?.paused) {
        audioRef.current.play().catch(e => console.warn('Still blocked', e))
      }
    }

    // Add listeners for generic user interactions
    window.addEventListener('click', handleInteraction, { once: true })
    window.addEventListener('keydown', handleInteraction, { once: true })

    // Listen to custom event when settings change
    const onSettingsChange = () => {
      checkAndPlay()
    }
    
    window.addEventListener('pamana_settings_changed', onSettingsChange)

    return () => {
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
      window.removeEventListener('pamana_settings_changed', onSettingsChange)
    }
  }, [location.pathname])

  return null
}
