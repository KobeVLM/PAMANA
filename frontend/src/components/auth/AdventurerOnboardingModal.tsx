import React, { useState, useEffect } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/modal'
import { Star, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AdventurerOnboardingModalProps {
  open: boolean
  onComplete: (data: { name: string; gender: 'Lalaki' | 'Babae' }) => Promise<void> | void
  initialName?: string
  initialGender?: 'Lalaki' | 'Babae'
  isLoading?: boolean
}

export const AdventurerOnboardingModal: React.FC<AdventurerOnboardingModalProps> = ({
  open,
  onComplete,
  initialName = '',
  initialGender = 'Lalaki',
  isLoading = false,
}) => {
  const [name, setName] = useState(initialName)
  const [gender, setGender] = useState<'Lalaki' | 'Babae'>(initialGender)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [boyImgErr, setBoyImgErr] = useState(false)
  const [girlImgErr, setGirlImgErr] = useState(false)

  useEffect(() => {
    if (initialName) {
      setName(initialName)
    }
  }, [initialName])

  useEffect(() => {
    if (initialGender) {
      setGender(initialGender)
    }
  }, [initialGender])

  useEffect(() => {
    if (open) {
      setError(null)
    }
  }, [open])

  const isBusy = isLoading || isSubmitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Please enter your adventurer name.')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      await onComplete({ name: trimmedName, gender })
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save your adventurer profile. Please try again.'
      setError(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal open={open}>
      <ModalContent
        showClose={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="max-w-md w-[calc(100vw-2rem)] p-6 sm:p-8 bg-white border-4 border-white rounded-[2rem] shadow-[0_12px_0_rgba(0,0,0,0.15)] text-center"
      >
        <ModalHeader className="flex flex-col items-center text-center pr-0 mb-4">
          {/* Header game badge */}
          <div className="w-16 h-16 rounded-full bg-[#FFF9C4] border-4 border-[#FFC107] flex items-center justify-center mb-3 shadow-md">
            <Star className="w-8 h-8 text-[#F57F17] fill-[#FFC107] drop-shadow-sm" />
          </div>

          <ModalTitle className="text-2xl sm:text-3xl font-black text-[#2b5c3b] tracking-tight">
            Create Your Adventurer!
          </ModalTitle>
          <ModalDescription className="text-sm sm:text-base font-bold text-[#5a7a63] mt-1">
            Customize your character to begin your journey.
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Step 1: Character Gender Selection */}
          <div className="space-y-3 text-left">
            <span className="block text-sm sm:text-base font-black text-[#2b5c3b] uppercase tracking-wide">
              1. Choose your character
            </span>
            <div className="grid grid-cols-2 gap-4">
              {/* Boy Option */}
              <button
                type="button"
                onClick={() => setGender('Lalaki')}
                aria-label="Select Boy character"
                aria-pressed={gender === 'Lalaki'}
                className={cn(
                  'relative flex flex-col items-center justify-center p-4 rounded-2xl border-4 transition-all duration-150 cursor-pointer select-none',
                  gender === 'Lalaki'
                    ? 'border-[#FFC107] bg-[#FFFDE7] shadow-[0_4px_12px_rgba(255,193,7,0.35)] scale-[1.02]'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 opacity-80 hover:opacity-100'
                )}
              >
                {gender === 'Lalaki' && (
                  <div className="absolute top-2 right-2 bg-[#FFC107] text-white rounded-full p-1 shadow-sm">
                    <Check className="w-4 h-4 stroke-[4]" />
                  </div>
                )}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#E8F5E9] border-2 border-white shadow-md flex items-center justify-center overflow-hidden mb-2">
                  {!boyImgErr ? (
                    <img
                      src="/images/M_User.png"
                      alt="Boy"
                      className="w-full h-full object-cover"
                      onError={() => setBoyImgErr(true)}
                    />
                  ) : (
                    <span className="text-4xl" role="img" aria-label="Boy">
                      👦
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    'font-black text-lg transition-colors',
                    gender === 'Lalaki' ? 'text-[#5D4037]' : 'text-slate-700'
                  )}
                >
                  Boy
                </span>
              </button>

              {/* Girl Option */}
              <button
                type="button"
                onClick={() => setGender('Babae')}
                aria-label="Select Girl character"
                aria-pressed={gender === 'Babae'}
                className={cn(
                  'relative flex flex-col items-center justify-center p-4 rounded-2xl border-4 transition-all duration-150 cursor-pointer select-none',
                  gender === 'Babae'
                    ? 'border-[#FFC107] bg-[#FFFDE7] shadow-[0_4px_12px_rgba(255,193,7,0.35)] scale-[1.02]'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 opacity-80 hover:opacity-100'
                )}
              >
                {gender === 'Babae' && (
                  <div className="absolute top-2 right-2 bg-[#FFC107] text-white rounded-full p-1 shadow-sm">
                    <Check className="w-4 h-4 stroke-[4]" />
                  </div>
                )}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#FFF0F5] border-2 border-white shadow-md flex items-center justify-center overflow-hidden mb-2">
                  {!girlImgErr ? (
                    <img
                      src="/images/F_User.png"
                      alt="Girl"
                      className="w-full h-full object-cover"
                      onError={() => setGirlImgErr(true)}
                    />
                  ) : (
                    <span className="text-4xl" role="img" aria-label="Girl">
                      👧
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    'font-black text-lg transition-colors',
                    gender === 'Babae' ? 'text-[#5D4037]' : 'text-slate-700'
                  )}
                >
                  Girl
                </span>
              </button>
            </div>
          </div>

          {/* Step 2: Name Input */}
          <div className="space-y-2 text-left">
            <label
              htmlFor="adventurer-name"
              className="block text-sm sm:text-base font-black text-[#2b5c3b] uppercase tracking-wide"
            >
              2. What is your name?
            </label>
            <input
              id="adventurer-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError(null)
              }}
              placeholder="e.g. Juan dela Cruz or Captain Maria"
              disabled={isBusy}
              className={cn(
                'w-full py-3 px-4 bg-slate-100 rounded-2xl text-slate-800 font-bold text-base transition-all border-2',
                'focus:outline-none focus:ring-4 focus:ring-[#4CAF50]/30',
                error
                  ? 'border-red-400 bg-red-50/50 focus:border-red-500'
                  : 'border-slate-200 focus:border-[#4CAF50]'
              )}
            />
            {error && (
              <p className="text-red-500 font-bold text-xs sm:text-sm mt-1 ml-1">
                {error}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isBusy}
            className="bg-[#4CAF50] hover:bg-[#43A047] text-white font-black text-lg md:text-xl py-3.5 px-6 rounded-2xl shadow-[0_6px_0_#2E7D32] active:translate-y-1 active:shadow-none transition-all w-full flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isBusy ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin stroke-[3]" />
                <span>Begin Adventure! 🚀</span>
              </>
            ) : (
              <span>Begin Adventure! 🚀</span>
            )}
          </button>
        </form>
      </ModalContent>
    </Modal>
  )
}
