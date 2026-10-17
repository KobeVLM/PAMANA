import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PracticeCompletion } from "./PracticeCompletion"

vi.mock("canvas-confetti", () => ({ default: vi.fn() }))

describe("PracticeCompletion", () => {
  it("shows the score when provided", () => {
    render(
      <PracticeCompletion message="Tapos na!" score={2} total={3} onRetry={() => {}} />
    )
    expect(screen.getByText("2 / 3")).toBeInTheDocument()
    expect(screen.getByText("67% Katumpakan")).toBeInTheDocument()
  })

  it("hides the score card when no score is given", () => {
    render(<PracticeCompletion message="Natuto ka ng bagong salita!" onRetry={() => {}} />)
    expect(screen.getByText("Natuto ka ng bagong salita!")).toBeInTheDocument()
    expect(screen.queryByText(/Katumpakan/)).not.toBeInTheDocument()
  })

  it("fires the retry and exit actions", async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const onExit = vi.fn()
    render(
      <PracticeCompletion message="Tapos" onRetry={onRetry} onExit={onExit} />
    )

    await user.click(screen.getByRole("button", { name: /maglaro ulit/i }))
    await user.click(screen.getByRole("button", { name: /bumalik sa home/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it("renders an illustration instead of the trophy badge", () => {
    render(
      <PracticeCompletion
        message="Tapos"
        onRetry={() => {}}
        illustration={<img src="/images/Lola-C.png" alt="Lola" />}
      />
    )
    expect(screen.getByAltText("Lola")).toBeInTheDocument()
  })
})
