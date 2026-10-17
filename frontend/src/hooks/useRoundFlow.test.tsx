import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useRoundFlow } from "./useRoundFlow"

describe("useRoundFlow", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("scores correct answers and advances after the delay", () => {
    const onAdvance = vi.fn()
    const { result } = renderHook(() =>
      useRoundFlow({ totalRounds: 2, advanceDelayMs: 1000, onAdvance })
    )

    act(() => {
      result.current.answer({ selectedId: "a", correctId: "a", isCorrect: true })
    })
    expect(result.current.score).toBe(1)
    expect(result.current.feedback).toBe("correct")
    expect(result.current.isProcessing).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.roundIndex).toBe(1)
    expect(result.current.feedback).toBeNull()
    expect(result.current.isProcessing).toBe(false)
    expect(onAdvance).toHaveBeenCalledWith(1)
  })

  it("completes after the final round", () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() =>
      useRoundFlow({ totalRounds: 1, advanceDelayMs: 500, onComplete })
    )

    act(() => {
      result.current.answer({ selectedId: "b", correctId: "a", isCorrect: false })
    })
    expect(result.current.score).toBe(0)
    expect(result.current.feedback).toBe("incorrect")

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current.isComplete).toBe(true)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("ignores answers while processing", () => {
    const { result } = renderHook(() =>
      useRoundFlow({ totalRounds: 3, advanceDelayMs: 1000 })
    )

    act(() => {
      result.current.answer({ selectedId: "a", correctId: "a", isCorrect: true })
    })
    act(() => {
      result.current.answer({ selectedId: "b", correctId: "b", isCorrect: true })
    })
    expect(result.current.score).toBe(1)
    expect(result.current.selectedId).toBe("a")
  })

  it("reset clears state and pending timers", () => {
    const { result } = renderHook(() =>
      useRoundFlow({ totalRounds: 2, advanceDelayMs: 1000 })
    )

    act(() => {
      result.current.answer({ selectedId: "a", correctId: "a", isCorrect: true })
    })
    act(() => {
      result.current.reset()
    })
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.roundIndex).toBe(0)
    expect(result.current.score).toBe(0)
    expect(result.current.isComplete).toBe(false)
    expect(result.current.feedback).toBeNull()
  })
})
