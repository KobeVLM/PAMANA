import { useCallback, useState } from "react"
import api from "@/lib/api"
import { createRunId } from "@/lib/runId"

/** Which control produced the replay; mirrors the backend `source` column. */
export type ReplaySource = "npc" | "target" | "scaffold"

export interface ReplayTelemetryMeta {
  /** e.g. `npc_instruction`, `target_word`, `target_sentence`. */
  itemType: string
  /** Stable identifier for the audio, usually its asset path. */
  itemKey: string
  step?: string
  moduleNumber?: number
  source: ReplaySource
}

/**
 * Fire-and-forget telemetry for "Makinig Ulit" taps.
 *
 * This is the measurement hook for the Priority 2 refactoring: replay counts
 * must not affect answer progress, so replays go to their own append-only log.
 * A failed request is swallowed so a flaky connection never delays playback.
 */
export function useReplayTelemetry() {
  const [runId] = useState(createRunId)

  const trackReplay = useCallback(
    (meta: ReplayTelemetryMeta) => {
      const activity =
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/mastery")
          ? "practice"
          : "module"

      void api
        .post("/replay-events", { runId, activity, ...meta })
        .catch(() => {
          // Telemetry is best-effort; audio keeps working either way.
        })
    },
    [runId]
  )

  return { trackReplay, runId }
}
