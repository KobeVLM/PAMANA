import React, { useState, useEffect } from 'react'
import { Play } from 'lucide-react'
import { Modal, ModalContent, ModalTitle } from '@/components/ui/modal'

export const StoryModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Check if the user just registered
    const showStory = localStorage.getItem('show_intro_story')
    if (showStory === 'true') {
      setIsOpen(true)
    }
  }, [])

  const handleSkip = () => {
    setIsOpen(false)
    localStorage.removeItem('show_intro_story')
  }

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleSkip()
      }}
    >
      <ModalContent
        showClose={false}
        aria-describedby={undefined}
        className="h-[100dvh] max-h-none w-screen max-w-none rounded-none border-0 p-0 sm:p-0"
      >
        <div className="flex h-full min-h-[100dvh] flex-col bg-black">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent px-6 py-4">
            <ModalTitle className="font-heading text-xl text-pamana-gold drop-shadow-md">
              KWENTO NG PAMANA...
            </ModalTitle>
          </div>

          {/* Video Placeholder (Full Screen) */}
          <div className="flex flex-1 items-center justify-center">
            {/* Actual Video goes here later */}
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-300">
                <Play className="ml-2 h-10 w-10" aria-hidden="true" />
              </div>
              <p className="text-lg font-medium uppercase tracking-widest text-white/60">
                VIDEO PLACEHOLDER
              </p>
            </div>
          </div>

          {/* Footer actions */}
          <div className="absolute bottom-8 right-8 z-10">
            <button
              type="button"
              onClick={handleSkip}
              className="rounded-full border border-white/20 bg-white/10 px-8 py-3 font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20"
            >
              I-SKIP
            </button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
