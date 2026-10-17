import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Button } from "./button"

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Simulan</Button>)
    expect(screen.getByRole("button", { name: "Simulan" })).toBeInTheDocument()
  })

  it("applies the pamana variant", () => {
    render(<Button variant="pamana">Go</Button>)
    expect(screen.getByRole("button", { name: "Go" })).toHaveClass("from-pamana-green")
  })

  it("shows a spinner and disables when loading", () => {
    render(<Button loading>Inaayos</Button>)
    const button = screen.getByRole("button", { name: /inaayos/i })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute("aria-busy", "true")
  })

  it("does not fire onClick when disabled", async () => {
    const user = userEvent.setup()
    let clicks = 0
    render(
      <Button disabled onClick={() => clicks++}>
        Naka-lock
      </Button>
    )
    await user.click(screen.getByRole("button", { name: "Naka-lock" }))
    expect(clicks).toBe(0)
  })
})
