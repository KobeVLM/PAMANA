import { bi, type Bi } from "@/lib/i18n"

/** How long the hand-cursor demonstration stays up before play begins. */
export const GESTURE_DEMO_MS = 5000

/**
 * Error-scaffolding level for the current item.
 *
 * 0 = no mistake yet, 1 = encourage + replay, 2 = remove one distractor,
 * 3 = compare the target and let the learner confirm it.
 */
export type ScaffoldStage = 0 | 1 | 2 | 3

/** Clamp an attempt count to the three documented stages. */
export function scaffoldStage(wrongAttempts: number): ScaffoldStage {
  if (!Number.isFinite(wrongAttempts) || wrongAttempts <= 0) return 0
  return Math.min(3, Math.floor(wrongAttempts)) as ScaffoldStage
}

export interface ScaffoldGuidance {
  message: Bi
  /** Replay the target sound (stage 1). */
  replay?: boolean
  /** A distractor is hidden (stage 2). */
  fadeDistractor?: boolean
  /** The target is compared and confirmed (stage 3). */
  compare?: boolean
}

/** Short, grade-2-friendly guidance for each stage. */
export function scaffoldGuidance(
  stage: ScaffoldStage,
  target?: string
): ScaffoldGuidance {
  switch (stage) {
    case 1:
      return {
        message: bi(
          "Halos nakuha mo na! Pakinggan nating muli...",
          "Almost there! Let’s listen again..."
        ),
        replay: true,
      }
    case 2:
      return {
        message: bi(
          "Isa nang mali ang tinanggal. Subukan ulit!",
          "We removed one wrong choice. Try again!"
        ),
        fadeDistractor: true,
      }
    case 3:
      return {
        message: target
          ? bi(
              `Heto ang tamang sagot: ${target}. I-tap para kumpirmahan.`,
              `Here is the answer: ${target}. Tap to confirm.`
            )
          : bi(
              "Heto ang tamang sagot. I-tap para kumpirmahan.",
              "Here is the answer. Tap to confirm."
            ),
        compare: true,
      }
    default:
      return { message: bi("", "") }
  }
}

/**
 * Pick one wrong option to fade at stage 2. Order is stable for a given item,
 * so the same distractor stays out while the child retries.
 */
export function fadedDistractorId(
  stage: ScaffoldStage,
  options: ReadonlyArray<{ id: string }>,
  correctId: string | null | undefined
): string | null {
  if (stage < 2 || !correctId) return null
  return options.find((option) => option.id !== correctId)?.id ?? null
}

/** Stage 3 reveals the answer and asks for an explicit confirming tap. */
export function needsClickToConfirm(stage: ScaffoldStage): boolean {
  return stage >= 3
}
