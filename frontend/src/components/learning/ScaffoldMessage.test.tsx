import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { ScaffoldMessage } from "./ScaffoldMessage"
import { FocusViewToggle } from "./FocusViewToggle"

describe("ScaffoldMessage", () => {
  it("renders nothing before the first mistake", () => {
    const { container } = render(<ScaffoldMessage stage={0} />)
    expect(container.firstChild).toBeNull()
  })

  it("offers a replay after the first mistake", () => {
    const onReplay = vi.fn()
    render(<ScaffoldMessage stage={1} onReplay={onReplay} />)

    expect(screen.getByText(/Halos nakuha mo na/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /Pindutin para marinig ulit/i }))
    expect(onReplay).toHaveBeenCalledTimes(1)
  })

  it("explains the narrowed choice at stage 2 without showing the answer", () => {
    render(<ScaffoldMessage stage={2} target="BA" />)

    expect(screen.getByText(/Isa nang mali ang tinanggal/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Confirm/i })).not.toBeInTheDocument()
    expect(screen.queryByText("BA")).not.toBeInTheDocument()
  })

  it("compares the parts with the target and confirms at stage 3", () => {
    const onConfirm = vi.fn()
    render(
      <ScaffoldMessage
        stage={3}
        parts={["B", "A"]}
        target="BA"
        onConfirm={onConfirm}
      />
    )

    expect(screen.getByText(/Heto ang tamang sagot: BA/)).toBeInTheDocument()
    expect(screen.getByText("B")).toBeInTheDocument()
    expect(screen.getByText("A")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /Kumpirmahin/i }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})

describe("FocusViewToggle", () => {
  it("exposes its state to assistive tech", () => {
    const onToggle = vi.fn()
    const { rerender } = render(
      <FocusViewToggle enabled={false} onToggle={onToggle} />
    )

    const toggle = screen.getByRole("button", { name: /Buksan ang Focus View/i })
    expect(toggle).toHaveAttribute("aria-pressed", "false")
    fireEvent.click(toggle)
    expect(onToggle).toHaveBeenCalledTimes(1)

    rerender(<FocusViewToggle enabled onToggle={onToggle} />)
    expect(
      screen.getByRole("button", { name: /Lumabas sa Focus View/i })
    ).toHaveAttribute("aria-pressed", "true")
  })
})
