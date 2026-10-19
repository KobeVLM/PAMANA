import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from "./modal"

function TestModal({ onOpenChange = vi.fn() }: { onOpenChange?: (open: boolean) => void }) {
  return (
    <Modal open onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalTitle>Ulitin ang Module?</ModalTitle>
        <ModalDescription>Mabubura ang progreso.</ModalDescription>
        <button type="button">Kumpirmahin</button>
      </ModalContent>
    </Modal>
  )
}

describe("Modal", () => {
  it("renders as an accessible dialog labelled by its title", () => {
    render(<TestModal />)
    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveAccessibleName("Ulitin ang Module?")
    expect(dialog).toHaveAccessibleDescription("Mabubura ang progreso.")
  })

  it("exposes a labelled close button", () => {
    render(<TestModal />)
    expect(screen.getByRole("button", { name: "Isara ang dialog" })).toBeInTheDocument()
  })

  it("closes on Escape", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<TestModal onOpenChange={onOpenChange} />)
    await user.keyboard("{Escape}")
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("traps focus inside the dialog", async () => {
    const user = userEvent.setup()
    render(<TestModal />)
    await user.tab()
    const dialog = screen.getByRole("dialog")
    expect(dialog.contains(document.activeElement)).toBe(true)
  })
})
