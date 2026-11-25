import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ReplayButton } from "./ReplayButton"

describe("ReplayButton", () => {
  it("is an oversized, bilingual, pulse-animated control", () => {
    render(<ReplayButton onReplay={vi.fn()} />)

    const button = screen.getByRole("button", { name: /Makinig Ulit/i })
    expect(button).toHaveClass("min-h-[56px]", "min-w-[56px]")
    expect(button).toHaveClass("animate-replay-pulse")
    expect(button).toHaveTextContent("Makinig Ulit")
    expect(button).toHaveTextContent("Listen Again")
  })

  it("calls replay immediately and marks itself while speaking", async () => {
    const user = userEvent.setup()
    const onReplay = vi.fn()
    const { rerender } = render(<ReplayButton onReplay={onReplay} />)

    await user.click(screen.getByRole("button", { name: /Makinig Ulit/i }))
    expect(onReplay).toHaveBeenCalledTimes(1)

    rerender(<ReplayButton onReplay={onReplay} isSpeaking />)
    expect(screen.getByRole("button", { name: /Makinig Ulit/i })).toHaveAttribute(
      "data-speaking",
      "true"
    )
  })
})
