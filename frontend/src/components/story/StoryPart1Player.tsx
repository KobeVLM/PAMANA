import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSearchParams } from 'react-router-dom'

const STORY_KEY = (userId: string | number) => `pamana_story_part1_seen_${userId}`
const VIDEO_SRC = '/video/PART1.mp4'

export const StoryPart1Player: React.FC = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [open, setOpen] = useState(false)
  const [needsTap, setNeedsTap] = useState(false)
  const [videoError, setVideoError] = useState(false)

  const originalMusicPref = useRef<string | null>(null)

  // 1. Listen for manual trigger from the HomePage button
  useEffect(() => {
    const handlePlayStory = () => setOpen(true)
    window.addEventListener('pamana_play_story', handlePlayStory)
    return () => window.removeEventListener('pamana_play_story', handlePlayStory)
  }, [])

  // 2. Auto-play on first login
  useEffect(() => {
    if (!user?.id) return
    const isNewRegistration = searchParams.get('new') === 'true'
    const seen = localStorage.getItem(STORY_KEY(user.id))
    
    if (isNewRegistration || !seen) {
      setOpen(true)
    }
  }, [user?.id, searchParams])

  useEffect(() => {
    if (!open) return
    
    // Turn off BGM
    originalMusicPref.current = localStorage.getItem('pamana_bgm')
    localStorage.setItem('pamana_bgm', 'false')
    window.dispatchEvent(new Event('pamana_settings_changed'))

    const v = videoRef.current
    if (!v) return
    
    // Reset video to start if replayed
    v.currentTime = 0
    
    v.play().catch(() => {
      setNeedsTap(true)
    })
    
    const timer = setTimeout(() => {
      if (v.paused) setNeedsTap(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [open])

  const markSeen = () => {
    if (user?.id) localStorage.setItem(STORY_KEY(user.id), '1')
    if (searchParams.has('new')) {
      searchParams.delete('new')
      setSearchParams(searchParams, { replace: true })
    }
    setOpen(false)
    
    // Restore BGM
    if (originalMusicPref.current !== null) {
      localStorage.setItem('pamana_bgm', originalMusicPref.current)
    } else {
      localStorage.setItem('pamana_bgm', 'true')
    }
    window.dispatchEvent(new Event('pamana_settings_changed'))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden p-4 md:p-8">
      
      {/* Blurred Background */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-0" />

      <div className="relative w-full h-full max-w-[1600px] flex items-center justify-center z-10">
        {videoError ? (
          <div className="text-center text-white p-8 bg-black/50 rounded-2xl backdrop-blur-md">
            <p className="text-xl font-bold mb-4">Story video not found.</p>
            <button onClick={markSeen} className="bg-white text-black font-black px-6 py-3 rounded-2xl hover:scale-105 transition-transform">
              Continue
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={VIDEO_SRC}
              className="w-full h-full object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
              playsInline
              onEnded={markSeen}
              onError={() => setVideoError(true)}
              onClick={() => {
                if (videoRef.current?.paused) {
                  videoRef.current.play().catch(() => setNeedsTap(true))
                  setNeedsTap(false)
                } else {
                  videoRef.current?.pause()
                }
              }} 
            />
            
            {needsTap && (
              <button
                onClick={() => {
                  setNeedsTap(false)
                  videoRef.current?.play().catch(() => setNeedsTap(true))
                }}
                className="absolute inset-0 m-auto w-32 h-32 flex items-center justify-center text-white text-5xl font-black bg-black/60 rounded-full hover:bg-black/80 hover:scale-110 transition-all border-4 border-white z-20"
              >
                ▶
              </button>
            )}
          </>
        )}
      </div>

      <button
        onClick={markSeen}
        className="absolute bottom-4 right-4 md:bottom-6 md:right-6 text-white text-sm md:text-base font-black bg-black/50 hover:bg-black/80 px-4 py-1.5 md:px-5 md:py-2 rounded-full border border-white/20 transition-all z-50 shadow-lg backdrop-blur-md"
      >
        Skip ✕
      </button>

    </div>
  )
}