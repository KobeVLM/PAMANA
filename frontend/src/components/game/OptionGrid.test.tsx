import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { OptionGrid } from "./OptionGrid"

const OPTIONS = [
  { id: "ba", label: "BA" },
  { id: "ka", label: "KA" },
  { id: "la", label: "LA" },
  { id: "ma", label: "MA" },
]

describe("OptionGrid", () => {
  it("does not reveal the hint before the attempt threshold", () => {
    render(
      <OptionGrid options={OPTIONS} correctId="ba" attempts={2} onSelect={() => {}} />
    )
    const correct = screen.getByRole("button", { name: "BA" })
    expect(correct.className).not.toContain("border-pamana-gold")
    expect(correct.className).not.toContain("animate-pulse")
  })

  it("highlights the correct option in gold once the threshold is reached", () => {
    render(
      <OptionGrid options={OPTIONS} correctId="ba" attempts={3} onSelect={() => {}} />
    )
    const correct = screen.getByRole("button", { name: "BA" })
    expect(correct.className).toContain("border-pamana-gold")
    expect(correct.className).toContain("animate-pulse")
  })

  it("keeps the wrong answer red and the hint gold on the same grid", () => {
    render(
      <OptionGrid
        options={OPTIONS}
        selectedId="ka"
        correctId="ba"
        attempts={3}
        onSelect={() => {}}
      />
    )
    const wrong = screen.getByRole("button", { name: "KA" })
    const correct = screen.getByRole("button", { name: "BA" })
    expect(wrong.className).toContain("border-red-400/70")
    expect(wrong.className).not.toContain("border-pamana-gold")
    expect(correct.className).toContain("border-pamana-gold")
    expect(correct.className).not.toContain("border-red-400/70")
  })

  it("locks every tile once the answer is revealed", () => {
    render(
      <OptionGrid options={OPTIONS} selectedId="ka" correctId="ba" onSelect={() => {}} />
    )
    for (const option of OPTIONS) {
      expect(screen.getByRole("button", { name: option.label })).toBeDisabled()
    }
  })

  it("exposes a labelled group and reports selections", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<OptionGrid options={OPTIONS} onSelect={onSelect} />)
    expect(
      screen.getByRole("group", { name: "Mga pagpipilian (Choices)" })
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "LA" }))
    expect(onSelect).toHaveBeenCalledWith("la")
  })

  it("blocks selections when disabled", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<OptionGrid options={OPTIONS} onSelect={onSelect} disabled />)
    await user.click(screen.getByRole("button", { name: "LA" }))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it("falls back to the label when an image tile fails to load", () => {
    render(
      <OptionGrid
        type="image"
        options={[{ id: "ulo", label: "ulo", imageUrl: "/images/ulo.png" }]}
        onSelect={() => {}}
      />
    )
    fireEvent.error(screen.getByAltText("ulo"))
    expect(screen.queryByAltText("ulo")).not.toBeInTheDocument()
    expect(screen.getByText("ulo")).toBeInTheDocument()
  })
})
