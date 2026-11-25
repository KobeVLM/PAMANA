import { describe, it, expect, vi, beforeEach } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import api from "@/lib/api"
import { usePracticeAnswerProgress } from "./usePracticeAnswerProgress"

vi.mock("@/lib/api", () => ({
  default: { post: vi.fn(() => Promise.resolve({ status: 201 })) },
}))

const mockPost = api.post as ReturnType<typeof vi.fn>

describe("usePracticeAnswerProgress", () => {
  beforeEach(() => {
    mockPost.mockClear()
  })

  it("records an answer locally and appends it to the event log", async () => {
    const { result } = renderHook(() =>
      usePracticeAnswerProgress(2, {
        itemType: "vocabulary_word",
        moduleNumber: 2,
      })
    )

    act(() => result.current.recordAnswer("word-1:basahin", true, "basahin"))

    expect(result.current.progress).toBe(50)
    expect(result.current.correctItems).toBe(1)

    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1))
    expect(mockPost).toHaveBeenCalledWith("/answer-events", {
      runId: result.current.runId,
      activity: "practice",
      itemType: "vocabulary_word",
      itemKey: "word-1:basahin",
      step: "basahin",
      moduleNumber: 2,
      correct: true,
    })
  })

  it("keeps one run id and a monotone bar across retries", async () => {
    const { result } = renderHook(() =>
      usePracticeAnswerProgress(2, {
        itemType: "syllable_set",
        moduleNumber: 1,
      })
    )
    const runId = result.current.runId

    act(() => {
      result.current.recordAnswer("pagsama:1", false, "pagsama")
      result.current.recordAnswer("pagsama:1", true, "pagsama")
      result.current.recordAnswer("pagsama:2", true, "pagsama")
    })

    expect(result.current.progress).toBe(100)
    expect(result.current.wrongAttempts).toBe(1)
    expect(result.current.runId).toBe(runId)

    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(3))
    expect(mockPost.mock.calls.every((call) => call[1].runId === runId)).toBe(true)
  })

  it("does not break gameplay when persistence fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("offline"))
    const { result } = renderHook(() =>
      usePracticeAnswerProgress(1, { itemType: "sentence_task", moduleNumber: 4 })
    )

    act(() => result.current.recordAnswer("task-1", true, "tier1"))

    expect(result.current.progress).toBe(100)
    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1))
  })
})
