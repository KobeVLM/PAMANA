import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

const DIRECTIONS = [
  'up-left',
  'up',
  'up-right',
  'left',
  'center',
  'right',
  'down-left',
  'down',
  'down-right',
] as const

const REACTIONS = [
  'blink',
  'heart',
  'sparkle',
  'surprised',
  'wink',
  'bashful',
  'sleepy',
  'dizzy',
  'delighted',
] as const

type Direction = (typeof DIRECTIONS)[number]
type Reaction = (typeof REACTIONS)[number]

// Clockwise from the right, matching atan2 with y pointing down.
const CLOCKWISE: Direction[] = [
  'right',
  'down-right',
  'down',
  'down-left',
  'left',
  'up-left',
  'up',
  'up-right',
]
const SECTOR = (Math.PI * 2) / CLOCKWISE.length
const HYSTERESIS = 0.12
const DEAD_ZONE = 70

const PAYOFFS: Reaction[] = ['heart', 'sparkle', 'delighted']
const BOOP_PAYOFF = 120
const BOOP_END = 560
const CELEBRATE_MS = 1400
const SQUASH_MS = 420
const DIZZY_AFTER = 4
const DIZZY_WINDOW = 1600
const DIZZY_END = 1100

const SQUASH: Keyframe[] = [
  { transform: 'scale(1, 1)', easing: 'ease-in' },
  { transform: 'scale(1.10, 0.86)', offset: 0.18, easing: 'ease-out' },
  { transform: 'scale(0.95, 1.08)', offset: 0.45, easing: 'ease-in-out' },
  { transform: 'scale(1.03, 0.97)', offset: 0.72, easing: 'ease-in-out' },
  { transform: 'scale(1, 1)' },
]

// background-size 300% makes each cell a clean 0/50/100% step on both axes.
function cell(index: number): CSSProperties {
  return { backgroundPosition: `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%` }
}

function wrap(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}

const layer: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundSize: '300% 300%',
  backgroundRepeat: 'no-repeat',
  // --- ADDED TRANSFORM HERE ---
  // Zooms the image by 10% and pushes it down by 6% to hide the gap
  transform: 'scale(1.1) translateY(0%)', 
  transformOrigin: 'top center',
}

export type MascotProps = {
  /** The 3x3 sheet of head directions. A served path, or an imported image. */
  directions: string
  /** The 3x3 sheet of expressions. */
  reactions: string
  size?: number
  className?: string
  /** What a screen reader calls it. */
  label?: string
  /**
   * Increment to make the mascot cheer: cycles heart -> sparkle -> delighted
   * for about a second and a half. `0` (the default) does nothing.
   */
  celebrate?: number
  /**
   * The current question's identity. Changing it clears an in-flight cheer, so
   * the happy face never bleeds into the next question.
   */
  resetKey?: unknown
  /** The module number to determine the background image. */
  moduleNumber?: number
}

/**
 * Vendored from page-mascot@0.1.0 (MIT) so tracking works on any device with a
 * mouse, trackpad or pen. Upstream gates tracking behind
 * `(hover: hover) and (pointer: fine)`, which reports false on touchscreen
 * laptops and some hybrid devices; here touch pointers are ignored instead.
 */
export function Mascot(props: MascotProps) {
  const { 
    directions, 
    reactions, 
    size = 140, 
    className, 
    label = 'mascot', 
    celebrate = 0, 
    resetKey,
    moduleNumber // 👈 Destructure the new prop
  } = props

  const buttonRef = useRef<HTMLButtonElement>(null)
  const squashRef = useRef<HTMLSpanElement>(null)
  const timersRef = useRef<number[]>([])
  const boopsRef = useRef({ count: 0, at: 0 })
  // Baseline at the current value: remounting mid-question (after a completion
  // screen) must not replay a cheer the player already earned.
  const celebrateRef = useRef(celebrate)
  const [direction, setDirection] = useState<Direction>('center')
  const [reaction, setReaction] = useState<Reaction | null>(null)

  // 👇 Helper to pick the background based on module
  const getBackgroundImage = () => {
    switch (moduleNumber) {
      case 1: return '/images/module-bg/m1_w.png'
      case 2: return '/images/module-bg/m2_w.png'
      case 3: return '/images/module-bg/m3_w.png'
      case 4: return '/images/module-bg/m4_w.png'
      default: return '/images/O_wood.png' // Fallback
    }
  }

  useEffect(() => {
    let sector = -1
    let pointer: { x: number; y: number } | null = null

    const aim = () => {
      const button = buttonRef.current
      if (!button || !pointer) {
        return
      }

      const box = button.getBoundingClientRect()
      const dx = pointer.x - (box.left + box.width / 2)
      const dy = pointer.y - (box.top + box.height / 2)

      if (Math.hypot(dx, dy) < DEAD_ZONE) {
        sector = -1
        setDirection('center')
        return
      }

      // Hold the current sector until the pointer is well past its edge.
      const angle = Math.atan2(dy, dx)
      if (sector !== -1 && Math.abs(wrap(angle - sector * SECTOR)) < SECTOR / 2 + HYSTERESIS) {
        return
      }

      sector = (Math.round(angle / SECTOR) + CLOCKWISE.length) % CLOCKWISE.length
      setDirection(CLOCKWISE[sector])
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        return
      }
      pointer = { x: event.clientX, y: event.clientY }
      aim()
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('scroll', aim, { passive: true })

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('scroll', aim)
    }
  }, [])

  useEffect(() => {
    return () => {
      timersRef.current.forEach(window.clearTimeout)
    }
  }, [])

  // The question changed: drop any cheer still playing. Declared before the
  // cheer effect so a reward landing in the same commit still wins.
  useEffect(() => {
    timersRef.current.forEach(window.clearTimeout)
    timersRef.current = []
    setReaction(null)
  }, [resetKey])

  // External cheer: a correct answer bumps `celebrate`, which plays the next
  // happy expression in the payoff cycle.
  useEffect(() => {
    if (!celebrate || celebrate === celebrateRef.current) {
      return
    }
    celebrateRef.current = celebrate

    timersRef.current.forEach(window.clearTimeout)
    timersRef.current = []

    setReaction(PAYOFFS[(celebrate - 1) % PAYOFFS.length])
    timersRef.current.push(
      window.setTimeout(() => setReaction(null), CELEBRATE_MS)
    )
  }, [celebrate])

  const boop = () => {
    timersRef.current.forEach(window.clearTimeout)
    timersRef.current = []

    const later = (ms: number, next: Reaction | null) => {
      timersRef.current.push(window.setTimeout(() => setReaction(next), ms))
    }

    const now = Date.now()
    const boops = boopsRef.current
    boops.count = now - boops.at < DIZZY_WINDOW ? boops.count + 1 : 1
    boops.at = now

    if (boops.count >= DIZZY_AFTER) {
      boops.count = 0
      setReaction('dizzy')
      later(DIZZY_END, null)
    } else {
      setReaction('blink')
      later(BOOP_PAYOFF, PAYOFFS[(boops.count - 1) % PAYOFFS.length])
      later(BOOP_END, null)
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    // Per-keyframe easing with the effect itself linear: an easing on the effect
    // would reinterpret every offset and front-load the whole bounce.
    squashRef.current?.animate(SQUASH, { duration: SQUASH_MS, easing: 'linear' })
  }

  // Inline styles so the file drops into any project without a CSS framework.
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={boop}
      aria-label={`Boop the ${label}`}
      className={className}
      style={{
        position: 'relative',
        display: 'block',
        flexShrink: 0,
        width: size,
        height: size,
        padding: 0,
        
        // --- DYNAMIC BACKGROUND STYLES ---
        border: '4px solid #4A2F1D', 
        borderRadius: '50%',         
        overflow: 'hidden',          
        backgroundImage: `url("${getBackgroundImage()}")`, // 👈 Used here
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#8B5A2B', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)', 
        
        appearance: 'none',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <span
        ref={squashRef}
        style={{ position: 'relative', display: 'block', width: '100%', height: '100%', transformOrigin: '50% 78%' }}
      >
        <span
          style={{
            ...layer,
            backgroundImage: `url(${directions})`,
            ...cell(DIRECTIONS.indexOf(direction)),
            opacity: reaction ? 0 : 1,
          }}
        />
        {/* Always mounted so the sheet is fetched up front, never on the first click. */}
        <span
          style={{
            ...layer,
            backgroundImage: `url(${reactions})`,
            ...cell(REACTIONS.indexOf(reaction ?? 'blink')),
            opacity: reaction ? 1 : 0,
          }}
        />
      </span>
    </button>
  )
}