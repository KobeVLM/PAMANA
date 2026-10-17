import type { Transition, Variants } from "framer-motion"
import { useReducedMotion } from "framer-motion"

/**
 * Central motion language for PAMANA.
 *
 * Components should pair these with `useReducedMotionSafe()` so users who
 * prefer reduced motion get instant state changes instead of springs.
 */

export const spring: Transition = { type: "spring", stiffness: 320, damping: 26 }
export const softSpring: Transition = { type: "spring", stiffness: 180, damping: 22 }

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: softSpring },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
}

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: spring },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: softSpring },
}

/** Slide a page in gently; used by route-level wrappers. */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: softSpring },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

/**
 * Returns true when the user prefers reduced motion.
 * Re-exported so feature code imports motion settings from one place.
 */
export function useReducedMotionSafe(): boolean {
  return useReducedMotion() ?? false
}
