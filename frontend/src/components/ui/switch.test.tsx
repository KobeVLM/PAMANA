import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Switch } from "./switch"

describe("Switch", () => {
  it("is exposed as a switch with checked state", () => {
    render(<Switch checked aria-label="Musika" />)
    const control = screen.getByRole("switch", { name: "Musika" })
    expect(control).toBeChecked()
  })

  it("toggles via keyboard", async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<Switch aria-label="Musika" onCheckedChange={onCheckedChange} />)
    const control = screen.getByRole("switch", { name: "Musika" })
    control.focus()
    await user.keyboard(" ")
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })
})
