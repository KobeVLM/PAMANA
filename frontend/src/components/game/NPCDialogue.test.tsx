import { StrictMode } from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { NPCDialogue } from "./NPCDialogue"

const { playAudioMock } = vi.hoisted(() => ({ playAudioMock: vi.fn() }))

vi.mock("@/contexts/AudioContext", () => ({
  useAudio: () => ({ playAudio: playAudioMock }),
}))

function sheetUrls(button: HTMLElement) {
  return Array.from(button.querySelectorAll("span")).map(
    (el) => (el as HTMLElement).style.backgroundImage
  )
}

function reactionLayer() {
  const layers = Array.from(
    screen.getByRole("button", { name: "Boop the Lolo" }).querySelectorAll("span")
  ) as HTMLElement[]
  return layers.find((el) => el.style.backgroundImage.includes("grandpa-reactions.webp"))
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

  it("cheers with the next happy expression when celebrate is bumped", () => {
    const { rerender } = render(<NPCDialogue npc="lolo" line="Tama!" />)

    rerender(<NPCDialogue npc="lolo" line="Tama!" celebrate={3} />)
    expect(reactionLayer()?.style.backgroundPosition).toBe("100% 100%")

    rerender(<NPCDialogue npc="lolo" line="Tama!" celebrate={4} />)
    expect(reactionLayer()?.style.backgroundPosition).toBe("50% 0%")
  })

  it("does not replay a cheer when remounting with a carried-over counter", () => {
    render(<NPCDialogue npc="lolo" line="Tama!" celebrate={3} />)

    expect(reactionLayer()?.style.backgroundPosition).toBe("0% 0%")
  })

  it("clears an in-flight cheer when the question changes", () => {
    const { rerender } = render(
      <NPCDialogue npc="lolo" line="Tama!" resetKey="q1" />
    )

    rerender(<NPCDialogue npc="lolo" line="Tama!" celebrate={1} resetKey="q1" />)
    expect(reactionLayer()?.style.backgroundPosition).toBe("50% 0%")

    rerender(<NPCDialogue npc="lolo" line="Tama!" celebrate={1} resetKey="q2" />)
    expect(reactionLayer()?.style.backgroundPosition).toBe("0% 0%")
  })

  it("reveals the English translation only when the toggle is pressed", async () => {
    const user = userEvent.setup()
    render(
      <NPCDialogue
        npc="lolo"
        line="Pakinggan nang mabuti!"
        lineEn="Listen carefully!"
      />
    )

    expect(screen.getByText("Pakinggan nang mabuti!")).toBeInTheDocument()
    expect(screen.queryByText("Listen carefully!")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /show english/i }))

    expect(screen.getByText("Listen carefully!")).toBeInTheDocument()
  })

  it("reports the instruction ending under StrictMode", async () => {
    playAudioMock.mockReset()
    let finish!: (result: "ended") => void
    playAudioMock.mockImplementation(
      () => new Promise((resolve) => { finish = resolve })
    )
    const onAudioEnd = vi.fn()

    render(
      <StrictMode>
        <NPCDialogue
          npc="lolo"
          line="Pakinggan ang salita."
          audioUrl="/audio/npc/test.mp3"
          autoPlay
          onAudioEnd={onAudioEnd}
        />
      </StrictMode>
    )

    await waitFor(() => expect(playAudioMock).toHaveBeenCalledTimes(1))
    finish("ended")

    await waitFor(() => expect(onAudioEnd).toHaveBeenCalledTimes(1))
  })
})
