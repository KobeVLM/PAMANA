import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { GestureDemo } from "./GestureDemo"
import { bi } from "@/lib/i18n"

const LABEL = bi("I-tap ang tamang sagot", "Tap the correct answer")

describe("GestureDemo", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows bilingual guidance and completes after two seconds by default", () => {
    const onComplete = vi.fn()
    render(<GestureDemo label={LABEL} onComplete={onComplete} />)

    expect(screen.getByRole("status")).toHaveTextContent("I-tap ang tamang sagot")
    expect(screen.getByRole("status")).toHaveTextContent("Tap the correct answer")
    expect(onComplete).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(2000))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("lets a child skip the demonstration", () => {
    const onComplete = vi.fn()
    render(<GestureDemo label={LABEL} onComplete={onComplete} durationMs={5000} />)

    fireEvent.click(screen.getByRole("button", { name: /Skip/i }))
    expect(onComplete).toHaveBeenCalledTimes(1)

    act(() => vi.advanceTimersByTime(5000))
    // Timer cleanup prevents a second completion after unmount/skip.
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
