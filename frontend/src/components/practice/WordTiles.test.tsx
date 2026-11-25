import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { WordTiles, type WordTile } from "./WordTiles"

const ITEMS: WordTile[] = [
  { id: "a", word: "Ang" },
  { id: "b", word: "pusa" },
  { id: "c", word: "ay" },
]

describe("WordTiles", () => {
  it("renders every tile as a visible button", () => {
    render(<WordTiles items={ITEMS} onReorder={vi.fn()} />)

    expect(screen.getAllByRole("button")).toHaveLength(3)
    expect(screen.getByText("Ang")).toBeInTheDocument()
  })

  it("keeps locked tiles visible but blocks tap-to-swap on them", async () => {
    const user = userEvent.setup()
    const onSelectIndex = vi.fn()
    render(
      <WordTiles
        items={ITEMS}
        onReorder={vi.fn()}
        onSelectIndex={onSelectIndex}
        lockedIndices={[1]}
      />
    )

    const locked = screen.getByRole("button", {
      name: "pusa (naka-lock)",
    })
    expect(locked).toBeDisabled()
    expect(locked).toHaveTextContent("pusa")

    await user.click(locked)
    expect(onSelectIndex).not.toHaveBeenCalled()

    // An unlocked tile is still interactive.
    await user.click(screen.getByRole("button", { name: /Ang/ }))
    expect(onSelectIndex).toHaveBeenCalledWith(0)
  })
})
