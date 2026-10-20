import React from 'react'
import { cn } from '@/lib/utils'

interface WordSlotMachineProps {
  words?: string[]
  className?: string
}

const DEFAULT_WORDS = [
  'Mata', 'Ilong', 'Bibig', 'Kamay',
  'Paa', 'Tenga', 'Ulo', 'Tiyan',
  'Likod', 'Buhok', 'Balikat', 'Tuhod'
]

export const WordSlotMachine: React.FC<WordSlotMachineProps> = ({
  words = DEFAULT_WORDS,
  className
}) => {
  const source = words.length > 0 ? words : DEFAULT_WORDS
  // Ensure we have exactly 12 items for the math (360deg / 12 = 30deg)
  const items = [...source]
  while (items.length < 12) {
    items.push(...source)
  }
  const displayItems = items.slice(0, 12)

  return (
    <div className={cn('relative mx-auto flex h-[300px] w-48 items-center justify-center', className)}>
      <div className="slot-machine-stage">
        <div className="slot-machine-ring">
          {displayItems.map((word, i) => (
            <div
              key={`${word}-${i}`}
              className="slot-machine-item rounded-xl border-2 border-white bg-white font-heading text-lg font-bold text-[#2b5c3b] shadow-[0_4px_0_rgba(0,0,0,0.12)]"
              style={{ transform: `rotateX(${30 * i}deg) translateZ(120px)` }}
            >
              {word}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -top-6 z-20 w-full text-center text-sm font-bold text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.25)]">
        Mga Susunod na Salita...
      </div>
    </div>
  )
}

export default WordSlotMachine
