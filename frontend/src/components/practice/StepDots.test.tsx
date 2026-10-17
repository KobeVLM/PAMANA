import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { StepDots } from "./StepDots"

const STEPS = [
  { label: "Pakinggan", state: "done" as const },
  { label: "Kilalanin", state: "current" as const },
  { label: "Basahin", state: "pending" as const },
]

describe("StepDots", () => {
  it("renders one dot per step", () => {
    render(<StepDots steps={STEPS} />)
    expect(screen.getAllByRole("listitem")).toHaveLength(3)
  })

  it("marks only the current step with aria-current=step", () => {
    render(<StepDots steps={STEPS} />)
    const items = screen.getAllByRole("listitem")
    expect(items[0]).not.toHaveAttribute("aria-current")
    expect(items[1]).toHaveAttribute("aria-current", "step")
    expect(items[2]).not.toHaveAttribute("aria-current")
  })

  it("announces each step state to screen readers", () => {
    render(<StepDots steps={STEPS} />)
    expect(screen.getByText("Pakinggan — tapos na (done)")).toBeInTheDocument()
    expect(
      screen.getByText("Kilalanin — kasalukuyan (current)")
    ).toBeInTheDocument()
    expect(screen.getByText("Basahin — susunod pa (pending)")).toBeInTheDocument()
  })

  it("shows the current step label visibly", () => {
    render(<StepDots steps={STEPS} />)
    expect(screen.getByText("Kilalanin")).toBeInTheDocument()
  })

  it("renders without a visible label when no step is current", () => {
    render(
      <StepDots
        steps={[
          { label: "Pakinggan", state: "done" },
          { label: "Kilalanin", state: "done" },
        ]}
      />
    )
    expect(screen.queryByText("Pakinggan")).not.toBeInTheDocument()
    expect(screen.queryByText("Kilalanin")).not.toBeInTheDocument()
  })
})
