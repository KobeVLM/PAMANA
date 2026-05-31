import React, { useState, useEffect } from 'react'
import { Play } from 'lucide-react'

export const StoryModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Check if the user just registered
    const showStory = localStorage.getItem('show_intro_story')
    if (showStory === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(true)
    }
  }, [])

  const handleSkip = () => {
    setIsOpen(false)
    localStorage.removeItem('show_intro_story')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
        <h2 className="text-xl font-heading font-bold text-pamana-gold drop-shadow-md">
          KWENTO NG PAMANA...
        </h2>
      </div>

      {/* Video Placeholder (Full Screen) */}
      <div className="flex-1 w-full h-full flex items-center justify-center relative">
        {/* Actual Video goes here later */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto cursor-pointer hover:bg-pamana-gold hover:text-green-900 transition-colors text-white duration-300">
            <Play className="w-10 h-10 ml-2" />
          </div>
          <p className="text-white/60 font-medium tracking-widest uppercase text-lg">VIDEO PLACEHOLDER</p>
        </div>
      </div>

      {/* Footer actions */}
      <div className="absolute bottom-8 right-8 z-10">
        <button
          onClick={handleSkip}
          className="px-8 py-3 rounded-full bg-white/10 text-white font-semibold hover:bg-white/20 transition-all border border-white/20 backdrop-blur-md"
        >
          I-SKIP
        </button>
      </div>
    </div>
  )
}
