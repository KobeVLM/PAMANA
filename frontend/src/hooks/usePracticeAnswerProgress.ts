import { useCallback, useState } from "react"
import api from "@/lib/api"
import { createRunId } from "@/lib/runId"
import {
  useAnswerProgress,
  type UseAnswerProgressResult,
} from "./useAnswerProgress"

export interface PracticeAnswerMeta {
  /** Matches the backend item_type column, e.g. `vocabulary_word`. */
  itemType: string
  moduleNumber: number
}

export interface UsePracticeAnswerProgressResult
  extends Omit<UseAnswerProgressResult, "recordAnswer"> {
  /** Records locally and appends the answer to the server-side event log. */
  recordAnswer: (itemKey: string, isCorrect: boolean, step?: string) => void
  runId: string
}

/**
 * Answer-based progress for Practice Mode.
 *
 * Practice screens deliberately do not write to the mastery tables: a child
 * may retry freely there without changing the lesson score. Persisting the
 * answer as an event gives the practice bar the same honest denominator as the
 * module bar. The POST is fire-and-forget so a network hiccup never freezes
 * the game; the local bar still advances immediately.
 */
export function usePracticeAnswerProgress(
  totalItems: number,
  meta: PracticeAnswerMeta
): UsePracticeAnswerProgressResult {
  const progress = useAnswerProgress(totalItems)
  const { recordAnswer: recordLocal } = progress
  const [runId] = useState(createRunId)

  const recordAnswer = useCallback(
    (itemKey: string, isCorrect: boolean, step?: string) => {
      recordLocal(itemKey, isCorrect)
      void api
        .post("/answer-events", {
          runId,
          activity: "practice",
          itemType: meta.itemType,
          itemKey,
          step,
          moduleNumber: meta.moduleNumber,
          correct: isCorrect,
        })
        .catch(() => {
          // Telemetry is best-effort; gameplay continues either way.
        })
    },
    [recordLocal, runId, meta.itemType, meta.moduleNumber]
  )

  return { ...progress, recordAnswer, runId }
}
