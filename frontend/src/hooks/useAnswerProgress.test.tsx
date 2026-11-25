import { describe, it, expect } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useAnswerProgress } from "./useAnswerProgress"

describe("useAnswerProgress", () => {
  it("starts at zero before any answer", () => {
    const { result } = renderHook(() => useAnswerProgress(4))

    expect(result.current.progress).toBe(0)
    expect(result.current.correctItems).toBe(0)
    expect(result.current.accuracy).toBeNull()
    expect(result.current.wrongAttempts).toBe(0)
  })

  it("counts distinct solved items, not attempts", () => {
    const { result } = renderHook(() => useAnswerProgress(4))

    act(() => {
      result.current.recordAnswer("word-1", true)
      result.current.recordAnswer("word-2", true)
      result.current.recordAnswer("word-3", false)
    })

    expect(result.current.progress).toBe(50)
    expect(result.current.correctItems).toBe(2)
    expect(result.current.answeredItems).toBe(3)
    // Three attempts, two correct: 67%.
    expect(result.current.accuracy).toBe(67)
    expect(result.current.wrongAttempts).toBe(1)
  })

  it("never moves backwards on a wrong retry", () => {
    const { result } = renderHook(() => useAnswerProgress(2))

    act(() => result.current.recordAnswer("word-1", true))
    expect(result.current.progress).toBe(50)

    act(() => result.current.recordAnswer("word-1", false))
    expect(result.current.progress).toBe(50)
    expect(result.current.wrongAttempts).toBe(1)
    // Accuracy can fall; progress cannot.
    expect(result.current.accuracy).toBe(50)
  })

  it("caps at 100% even when a solved item is answered again", () => {
    const { result } = renderHook(() => useAnswerProgress(2))

    act(() => {
      result.current.recordAnswer("a", true)
      result.current.recordAnswer("b", true)
      result.current.recordAnswer("a", true)
      result.current.recordAnswer("b", true)
    })

    expect(result.current.correctItems).toBe(2)
    expect(result.current.progress).toBe(100)
  })

  it("reads a changing item count so async loading cannot skew the bar", () => {
    const { result, rerender } = renderHook(
      ({ total }: { total: number }) => useAnswerProgress(total),
      { initialProps: { total: 5 } }
    )

    act(() => result.current.recordAnswer("a", true))
    expect(result.current.progress).toBe(20)

    rerender({ total: 2 })
    expect(result.current.progress).toBe(50)
  })

  it("tracks which items were solved and resets the whole run", () => {
    const { result } = renderHook(() => useAnswerProgress(3))

    act(() => {
      result.current.recordAnswer("a", true)
      result.current.recordAnswer("b", false)
    })
    expect(result.current.hasSolved("a")).toBe(true)
    expect(result.current.hasSolved("b")).toBe(false)

    act(() => result.current.reset())
    expect(result.current.progress).toBe(0)
    expect(result.current.accuracy).toBeNull()
    expect(result.current.correctItems).toBe(0)
    expect(result.current.answeredItems).toBe(0)
    expect(result.current.wrongAttempts).toBe(0)
    expect(result.current.hasSolved("a")).toBe(false)
  })
})
