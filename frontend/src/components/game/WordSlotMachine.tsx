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
  // Ensure we have exactly 12 items for the math (360deg / 12 = 30deg)
  const items = [...words]
  while (items.length < 12) {
    items.push(...words)
  }
  const displayItems = items.slice(0, 12)

  return (
    <div className={cn("relative w-48 h-[300px] flex items-center justify-center mx-auto", className)}>
      <style>
        {`
          .slot-machine-stage {
            perspective: 800px;
            width: 100%;
            height: 100%;
            position: relative;
            display: flex;
            align-items: center;
            justify-center;
          }
          
          .slot-machine-ring {
            width: 100%;
            height: 60px;
            transform-style: preserve-3d;
            animation: slot-spin 10s infinite linear;
          }
          
          @keyframes slot-spin {
            0% { transform: rotateX(360deg); }
            100% { transform: rotateX(0deg); }
          }
          
          .slot-machine-item {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            backface-visibility: hidden;
          }
        `}
      </style>
      
      <div className="slot-machine-stage">
        <div className="slot-machine-ring">
          {displayItems.map((word, i) => {
            const angle = 30 * i;
            return (
              <div 
                key={i} 
                className="slot-machine-item bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white font-heading font-bold text-lg shadow-lg"
                style={{ 
                  transform: `rotateX(${angle}deg) translateZ(120px)`
                }}
              >
                {word}
              </div>
            )
          })}
        </div>
        
        {/* Gradient overlays removed to make words fully visible */}
        <div className="absolute inset-0 pointer-events-none bg-transparent z-10" />
      </div>
      
      <div className="absolute -top-6 w-full text-center text-green-300 font-bold text-sm z-20">
        Mga Susunod na Salita...
      </div>
    </div>
  )
}
