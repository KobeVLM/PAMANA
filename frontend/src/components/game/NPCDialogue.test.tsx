import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { NPCDialogue } from "./NPCDialogue"

vi.mock("@/contexts/AudioContext", () => ({
  useAudio: () => ({ playAudio: vi.fn().mockResolvedValue(undefined) }),
}))

function sheetUrls(button: HTMLElement) {
  return Array.from(button.querySelectorAll("span")).map(
    (el) => (el as HTMLElement).style.backgroundImage
  )
}

describe("NPCDialogue", () => {
  it("shows the grandpa mascot for lolo", () => {
    render(<NPCDialogue npc="lolo" line="Kumusta, apo!" />)

    expect(screen.getByText("Lolo")).toBeInTheDocument()

    const urls = sheetUrls(screen.getByRole("button", { name: "Boop the Lolo" }))
    expect(urls.some((url) => url.includes("grandpa-directions.webp"))).toBe(true)
    expect(urls.some((url) => url.includes("grandpa-reactions.webp"))).toBe(true)
  })

  it("shows the granny mascot for lola", () => {
    render(<NPCDialogue npc="lola" line="Kumusta, apo!" />)

    expect(screen.getByText("Lola")).toBeInTheDocument()

    const urls = sheetUrls(screen.getByRole("button", { name: "Boop the Lola" }))
    expect(urls.some((url) => url.includes("granny-directions.webp"))).toBe(true)
    expect(urls.some((url) => url.includes("granny-reactions.webp"))).toBe(true)
  })

  it("shows the English translation under the line when provided", () => {
    render(
      <NPCDialogue
        npc="lolo"
        line="Pakinggan nang mabuti!"
        lineEn="Listen carefully!"
      />
    )

    expect(screen.getByText("Pakinggan nang mabuti!")).toBeInTheDocument()
    expect(screen.getByText("Listen carefully!")).toBeInTheDocument()
  })
})
