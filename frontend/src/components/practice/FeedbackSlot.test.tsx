import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { FeedbackSlot } from "./FeedbackSlot"

describe("FeedbackSlot", () => {
  it("renders its children and reserves space", () => {
    const { container } = render(
      <FeedbackSlot>
        <p>Tamang sagot!</p>
      </FeedbackSlot>
    )
    expect(screen.getByText("Tamang sagot!")).toBeInTheDocument()
    const slot = container.firstElementChild
    expect(slot).toHaveClass("min-h-[40px]")
    expect(slot).not.toHaveAttribute("data-empty")
  })

  it("keeps the reserved height when empty", () => {
    const { container } = render(<FeedbackSlot />)
    const slot = container.firstElementChild
    expect(slot).toHaveClass("min-h-[40px]")
    expect(slot).toHaveAttribute("data-empty", "true")
  })

  it("stretches banners to the full slot width", () => {
    const { container } = render(
      <FeedbackSlot>
        <p>Feedback</p>
      </FeedbackSlot>
    )
    expect(container.firstElementChild).toHaveClass("[&>*]:w-full")
  })
})
