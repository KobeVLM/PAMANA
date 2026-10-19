import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ErrorState } from "./ErrorState"

describe("ErrorState", () => {
  it("announces the failure", () => {
    render(<ErrorState />)
    expect(screen.getByRole("alert")).toHaveTextContent("May problema sa pagkonekta")
  })

  it("calls onRetry when the retry button is pressed", async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<ErrorState onRetry={onRetry} />)
    await user.click(screen.getByRole("button", { name: /subukan muli/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it("hides retry while retrying", () => {
    render(<ErrorState onRetry={vi.fn()} retrying />)
    const button = screen.getByRole("button", { name: /subukan muli/i })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute("aria-busy", "true")
  })
})
