import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { FeedbackBanner } from "./FeedbackBanner"

describe("FeedbackBanner", () => {
  it("announces correct feedback politely", () => {
    render(<FeedbackBanner variant="correct">Tama!</FeedbackBanner>)
    const status = screen.getByRole("status")
    expect(status).toHaveAttribute("aria-live", "polite")
    expect(status).toHaveTextContent("Tama!")
  })

  it("announces errors assertively when asked", () => {
    render(
      <FeedbackBanner variant="incorrect" assertive>
        Hindi pa tama — subukan ulit!
      </FeedbackBanner>
    )
    const alert = screen.getByRole("alert")
    expect(alert).toHaveAttribute("aria-live", "assertive")
    expect(alert).toHaveClass("border-[#EF5350]")
  })

  it("marks the status icon as decorative", () => {
    const { container } = render(<FeedbackBanner variant="hint">Pahiwatig</FeedbackBanner>)
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })

  it("can hide the icon entirely", () => {
    const { container } = render(
      <FeedbackBanner variant="info" hideIcon>
        Info
      </FeedbackBanner>
    )
    expect(container.querySelector("svg")).toBeNull()
  })
})
