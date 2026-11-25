import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  AccuracyChip,
  PracticeModeBadge,
  PracticeStepRail,
  ProgressPill,
} from "./PracticeHud"

describe("ProgressPill", () => {
  it("exposes the rounded percentage to assistive tech", () => {
    render(<ProgressPill value={37.5} />)

    const bar = screen.getByRole("progressbar")
    expect(bar).toHaveAttribute("aria-valuemin", "0")
    expect(bar).toHaveAttribute("aria-valuemax", "100")
    expect(bar).toHaveAttribute("aria-valuenow", "38")
    expect(bar).toHaveTextContent("38%")
  })

  it("clamps bad values into 0-100", () => {
    const { rerender } = render(<ProgressPill value={-30} />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0")

    rerender(<ProgressPill value={160} />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100")
  })

  it("shows a countable label instead of a percentage", () => {
    render(<ProgressPill value={40} label="2/5" />)

    expect(screen.getByRole("progressbar")).toHaveTextContent("2/5")
    expect(screen.getByRole("progressbar")).not.toHaveTextContent("40%")
  })
})

describe("PracticeStepRail", () => {
  it("marks the current step and renders nothing when empty", () => {
    const { container, rerender } = render(
      <PracticeStepRail
        steps={[
          { label: "Pakinig", state: "done" },
          { label: "Kilalanin", state: "current" },
          { label: "Basahin", state: "pending" },
        ]}
      />
    )

    expect(screen.getByText("Kilalanin")).toHaveAttribute("aria-current", "step")
    expect(screen.getByText("Pakinig")).not.toHaveAttribute("aria-current")
    expect(container.firstChild).not.toBeNull()

    rerender(<PracticeStepRail steps={[]} />)
    expect(container.firstChild).toBeNull()
  })
})

describe("AccuracyChip", () => {
  it("shows the accuracy through the shared star meter", () => {
    render(<AccuracyChip accuracy={90} />)

    expect(screen.getByLabelText("Katumpakan (Accuracy)")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: /90%/ })).toBeInTheDocument()
  })

  it("handles the no-answer-yet state", () => {
    render(<AccuracyChip accuracy={null} />)

    expect(screen.getByRole("img", { name: /Wala pang iskor/ })).toBeInTheDocument()
  })
})

describe("PracticeModeBadge", () => {
  it("renders the practice mode label", () => {
    render(<PracticeModeBadge />)
    expect(screen.getByText("Practice Mode")).toBeInTheDocument()
  })
})
