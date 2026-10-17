import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FillBlank } from "./FillBlank"

const OPTIONS = [
  { id: "w", label: "maliwanag" },
  { id: "x", label: "maitim" },
  { id: "y", label: "malamig" },
]

const TEMPLATE = "Ang aking _____ ay malaki at maliwanag."

const renderFillBlank = (props: Partial<Parameters<typeof FillBlank>[0]> = {}) =>
  render(
    <FillBlank
      template={TEMPLATE}
      options={OPTIONS}
      onSelect={vi.fn()}
      {...props}
    />
  )

describe("FillBlank", () => {
  it("renders the sentence with an empty placeholder blank", () => {
    const { container } = renderFillBlank()
    const blank = container.querySelector("p span")
    expect(blank).toHaveTextContent("?")
    expect(blank?.className).toContain("border-dashed")
    expect(screen.getByRole("group", { name: /Word choices/ })).toBeInTheDocument()
  })

  it("calls onSelect when a word chip is tapped", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    renderFillBlank({ onSelect })
    await user.click(screen.getByRole("button", { name: "maitim" }))
    expect(onSelect).toHaveBeenCalledWith("x")
  })

  it("fills the blank with the tapped word", () => {
    const { container } = renderFillBlank({ selectedId: "w", correctId: "w" })
    const blank = container.querySelector("p span")
    expect(blank).toHaveTextContent("maliwanag")
    expect(blank?.className).toContain("border-green-400")
  })

  it("places the word inside a four-underscore backend template", () => {
    const { container } = render(
      <FillBlank
        template="Ang aking ____ ay malinaw makakita."
        options={OPTIONS}
        selectedId="w"
        correctId="w"
        onSelect={vi.fn()}
      />
    )
    const sentence = container.querySelector("p")
    expect(sentence).toHaveTextContent("Ang aking maliwanag ay malinaw makakita.")
    expect(sentence?.textContent).not.toContain("_")
  })

  it("shows the retry state for a wrong placement", () => {
    const { container } = renderFillBlank({ selectedId: "x", correctId: "w" })
    const blank = container.querySelector("p span")
    expect(blank).toHaveTextContent("maitim")
    expect(blank?.className).toContain("animate-wiggle")
  })

  it("highlights the correct chip once the hint threshold is reached", () => {
    renderFillBlank({ attempts: 3, correctId: "w" })
    const chip = screen.getByRole("button", { name: "maliwanag" })
    expect(chip.className).toContain("animate-pulse")
    expect(chip.querySelector("svg")).not.toBeNull()
  })

  it("does not highlight any chip before the hint threshold", () => {
    renderFillBlank({ attempts: 2, correctId: "w" })
    const chip = screen.getByRole("button", { name: "maliwanag" })
    expect(chip.className).not.toContain("animate-pulse")
  })

  it("disables chips while the answer is being submitted", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    renderFillBlank({ onSelect, disabled: true })
    const chip = screen.getByRole("button", { name: "maliwanag" })
    expect(chip).toBeDisabled()
    await user.click(chip)
    expect(onSelect).not.toHaveBeenCalled()
  })
})
