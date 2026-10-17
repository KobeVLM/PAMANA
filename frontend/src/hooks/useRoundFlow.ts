import { useCallback, useEffect, useRef, useState } from "react"

export type RoundFeedback = "correct" | "incorrect" | null

export interface AnswerPayload {
  selectedId: string
  correctId: string
  isCorrect: boolean
}

export interface UseRoundFlowOptions {
  /** Number of rounds/questions in this run. */
  totalRounds: number
  /** How long to show feedback before advancing, in ms. */
  advanceDelayMs?: number
  /** Called once per answer, before the advance timer is scheduled. */
  onAnswer?: (isCorrect: boolean) => void
  /** Called when moving to the next round (fetch the next item here). */
  onAdvance?: (nextRoundIndex: number) => void
  /** Called once the final round has been answered. */
  onComplete?: () => void
}

export interface UseRoundFlowResult {
  roundIndex: number
  totalRounds: number
  score: number
  feedback: RoundFeedback
  selectedId: string | null
  correctId: string | null
  isProcessing: boolean
  isComplete: boolean
  /** 0-100 progress for the whole run. */
  progress: number
  answer: (payload: AnswerPayload) => void
  /** Restart from round 0. Keeps the score only if asked. */
  reset: (options?: { keepScore?: boolean }) => void
  /** Move to an arbitrary round without scoring (used for sub-level jumps). */
  jumpToRound: (index: number) => void
}

/**
 * Shared state machine for practice rounds: selection -> feedback ->
 * auto-advance -> completion. Owns the advance timer so unmount and resets
 * never leave a stray setTimeout behind.
 */
export function useRoundFlow({
  totalRounds,
  advanceDelayMs = 1500,
  onAnswer,
  onAdvance,
  onComplete,
}: UseRoundFlowOptions): UseRoundFlowResult {
  const [roundIndex, setRoundIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<RoundFeedback>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [correctId, setCorrectId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => clearTimer, [clearTimer])

  const answer = useCallback(
    ({ selectedId: picked, correctId: correct, isCorrect }: AnswerPayload) => {
      if (isProcessing || selectedId) return

      setSelectedId(picked)
      setCorrectId(correct)
      setFeedback(isCorrect ? "correct" : "incorrect")
      setIsProcessing(true)
      if (isCorrect) setScore((prev) => prev + 1)
      onAnswer?.(isCorrect)

      clearTimer()
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        setSelectedId(null)
        setCorrectId(null)
        setFeedback(null)
        setIsProcessing(false)

        const next = roundIndex + 1
        if (next >= totalRounds) {
          setIsComplete(true)
          onComplete?.()
        } else {
          setRoundIndex(next)
          onAdvance?.(next)
        }
      }, advanceDelayMs)
    },
    [
      isProcessing,
      selectedId,
      advanceDelayMs,
      roundIndex,
      totalRounds,
      onAnswer,
      onAdvance,
      onComplete,
      clearTimer,
    ]
  )

  const reset = useCallback(
    (options?: { keepScore?: boolean }) => {
      clearTimer()
      setRoundIndex(0)
      setFeedback(null)
      setSelectedId(null)
      setCorrectId(null)
      setIsProcessing(false)
      setIsComplete(false)
      if (!options?.keepScore) setScore(0)
    },
    [clearTimer]
  )

  const jumpToRound = useCallback(
    (index: number) => {
      clearTimer()
      setRoundIndex(index)
      setFeedback(null)
      setSelectedId(null)
      setCorrectId(null)
      setIsProcessing(false)
    },
    [clearTimer]
  )

  const safeTotal = Math.max(totalRounds, 1)
  const progress = Math.min(100, Math.round((roundIndex / safeTotal) * 100))

  return {
    roundIndex,
    totalRounds,
    score,
    feedback,
    selectedId,
    correctId,
    isProcessing,
    isComplete,
    progress,
    answer,
    reset,
    jumpToRound,
  }
}
