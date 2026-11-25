import { useCallback, useMemo, useState } from "react"

export interface AnswerProgress {
  /** Items in this run. */
  totalItems: number
  /** Distinct items answered correctly at least once. */
  correctItems: number
  /** Distinct items answered at least once, right or wrong. */
  answeredItems: number
  /** Every wrong attempt, including retries of the same item. */
  wrongAttempts: number
  /** Correct attempts / all attempts, 0-100, or null before the first answer. */
  accuracy: number | null
  /** 0-100, monotone: stays at 100 once every item is solved. */
  progress: number
}

export interface UseAnswerProgressResult extends AnswerProgress {
  /** Record one attempt. Call it the moment the child answers. */
  recordAnswer: (itemKey: string, isCorrect: boolean) => void
  /** Clear the run. The item count is passed in on every render, not stored. */
  reset: () => void
  hasSolved: (itemKey: string) => boolean
}

/**
 * Honest, answer-based progress for one practice run.
 *
 * Progress is `solved items / total items`, not position in the round. The
 * denominator is a count of items, so a wrong attempt can never lower the bar
 * (it only adds to {@link AnswerProgress.wrongAttempts}). Because the numerator
 * is a set of item keys, retrying the same item also cannot push past 100%.
 *
 * That is the rule from MVP Validation Priority #4: the bar moves the instant a
 * correct answer is recorded, and it never goes backwards.
 *
 * `totalItems` is read on every render (not frozen at mount) because practice
 * screens load their item list asynchronously.
 */
export function useAnswerProgress(totalItems: number): UseAnswerProgressResult {
  const [solved, setSolved] = useState<Set<string>>(() => new Set())
  const [answered, setAnswered] = useState<Set<string>>(() => new Set())
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [correctAttempts, setCorrectAttempts] = useState(0)
  const [wrongAttempts, setWrongAttempts] = useState(0)

  const recordAnswer = useCallback((itemKey: string, isCorrect: boolean) => {
    setAnswered((previous) => {
      if (previous.has(itemKey)) return previous
      const next = new Set(previous)
      next.add(itemKey)
      return next
    })

    setTotalAttempts((count) => count + 1)

    if (isCorrect) {
      setCorrectAttempts((count) => count + 1)
      setSolved((previous) => {
        if (previous.has(itemKey)) return previous
        const next = new Set(previous)
        next.add(itemKey)
        return next
      })
    } else {
      setWrongAttempts((count) => count + 1)
    }
  }, [])

  const reset = useCallback(() => {
    setSolved(new Set())
    setAnswered(new Set())
    setTotalAttempts(0)
    setCorrectAttempts(0)
    setWrongAttempts(0)
  }, [])

  const hasSolved = useCallback((itemKey: string) => solved.has(itemKey), [solved])

  const progress = useMemo(() => {
    if (totalItems <= 0) return 0
    return Math.min(100, Math.round((solved.size / totalItems) * 100))
  }, [solved, totalItems])

  const accuracy = useMemo(() => {
    if (totalAttempts === 0) return null
    return Math.round((correctAttempts / totalAttempts) * 100)
  }, [totalAttempts, correctAttempts])

  return {
    totalItems,
    correctItems: solved.size,
    answeredItems: answered.size,
    wrongAttempts,
    accuracy,
    progress,
    recordAnswer,
    reset,
    hasSolved,
  }
}
