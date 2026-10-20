import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { LoadingState } from "./LoadingState"

describe("LoadingState", () => {
  it("exposes a polite status region with the message", () => {
    render(<LoadingState message="Naglo-load ng aralin..." />)
    const status = screen.getByRole("status")
    expect(status).toHaveAttribute("aria-live", "polite")
    expect(status).toHaveTextContent("Naglo-load ng aralin...")
  })

  it("renders skeleton rows when requested", () => {
    const { container } = render(
      <LoadingState message="Naglo-load..." skeletonRows={3} />
    )
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThanOrEqual(3)
    expect(screen.getByRole("status")).toHaveTextContent("Naglo-load...")
  })
})
