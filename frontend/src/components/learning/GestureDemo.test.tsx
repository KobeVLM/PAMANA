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

  it("shows bilingual guidance and completes after five seconds by default", () => {
    const onComplete = vi.fn()
    render(<GestureDemo label={LABEL} onComplete={onComplete} />)

    expect(screen.getByRole("status")).toHaveTextContent("I-tap ang tamang sagot")
    expect(screen.getByRole("status")).toHaveTextContent("Tap the correct answer")
    expect(screen.getByRole("status")).toHaveTextContent("Tap anywhere to skip")
    expect(onComplete).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(5000))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("lets a child tap anywhere to skip the demonstration", () => {
    const onComplete = vi.fn()
    render(<GestureDemo label={LABEL} onComplete={onComplete} />)

    fireEvent.click(screen.getByRole("button", { name: /Skip/i }))
    expect(onComplete).toHaveBeenCalledTimes(1)

    act(() => vi.advanceTimersByTime(5000))
    // The ref guard prevents a second completion if the timer outlives the tap.
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
