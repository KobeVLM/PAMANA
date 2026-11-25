/**
 * Identifier for one play-through, sent with every answer so the backend can
 * group events into a single progress run.
 *
 * `crypto.randomUUID` is unavailable in some non-secure contexts, so fall back
 * to a time-and-random value. The id only needs to be unique per screen mount.
 */
export function createRunId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}
