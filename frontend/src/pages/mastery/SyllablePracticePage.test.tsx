import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import api from "@/lib/api"
import { SyllablePracticePage } from "./SyllablePracticePage"

vi.mock("@/lib/api", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1, name: "Test Learner", role: "LEARNER" } }),
}))

vi.mock("@/contexts/AudioContext", () => ({
  useAudio: () => ({ stopAudio: vi.fn() }),
}))

const { mockNavigate, mockReplay, mockPlayWrong } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockReplay: vi.fn(),
  mockPlayWrong: vi.fn(),
}))

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock("@/hooks/useGameAudio", () => ({
  useAudioElement: () => ({ replay: mockReplay }),
  useSfx: () => ({ playWrong: mockPlayWrong }),
}))

vi.mock("@/components/game/NPCDialogue", () => ({ NPCDialogue: () => null }))
vi.mock("@/components/game/AudioPlayer", () => ({
  AudioPlayer: () => <button type="button">audio</button>,
}))

const makeSet = (setId = 1) => ({
  setId,
  subLevel: "pagsama",
  consonant: "b",
  vowel: "a",
  targetSyllable: "ba",
  options: [
    { id: "ba", label: "BA" },
    { id: "ka", label: "KA" },
    { id: "la", label: "LA" },
    { id: "ma", label: "MA" },
  ],
  audioUrl: "/audio/ba.mp3",
  consonantAudioUrl: "/audio/b.mp3",
  vowelAudioUrl: "/audio/a.mp3",
})

const mockGet = api.get as Mock
const mockPost = api.post as Mock

const tile = (name: string) => screen.getByRole("button", { name })

const waitForRetry = async (name: string) => {
  await waitFor(
    () => expect(tile(name).style.backgroundImage).not.toContain("R_button.png"),
    { timeout: 4000 }
  )
}

describe("SyllablePracticePage", () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
    window.localStorage.clear()
    document.documentElement.classList.remove("pamana-focus")
    mockGet.mockImplementation((url: string) => {
      if (url.startsWith("/modules/progress/")) {
        return Promise.resolve({ data: [{ moduleNumber: 1, isComplete: true }] })
      }
      if (url.startsWith("/syllables/set?")) {
        const setId = Number(new URLSearchParams(url.split("?")[1]).get("setId") ?? 1)
        return Promise.resolve({ data: makeSet(setId) })
      }
      return Promise.resolve({ data: null })
    })
    mockPost.mockResolvedValue({ data: {} })
  })

  it("gates play with a hand-cursor demo and keeps the HUD in Focus View", async () => {
    const user = userEvent.setup()
    render(<SyllablePracticePage />)

    await screen.findByRole("button", { name: "BA" })
    expect(tile("BA")).toBeDisabled()
    expect(screen.getByRole("status")).toHaveTextContent("Tap the matching syllable")

    await user.click(screen.getByRole("button", { name: /Skip/i }))
    expect(tile("BA")).toBeEnabled()
    expect(screen.getByRole("progressbar")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Buksan ang Focus View/i }))
    expect(document.documentElement).toHaveClass("pamana-focus")
    expect(screen.getByRole("progressbar")).toBeInTheDocument()
  })

  it("walks through the three scaffolding stages on wrong attempts", async () => {
    const user = userEvent.setup()
    render(<SyllablePracticePage />)

    await screen.findByRole("button", { name: "BA" })
    await user.click(screen.getByRole("button", { name: /Skip/i }))

    // Stage 1: encouragement and a replay prompt, no answer revealed.
    await user.click(tile("KA"))
    expect(screen.getByText(/Halos nakuha mo na/)).toBeInTheDocument()
    expect(tile("KA").style.backgroundImage).toContain("R_button.png")

    // Stage 2: one wrong choice is faded and disabled.
    await waitForRetry("KA")
    await user.click(tile("KA"))
    expect(screen.getByText(/Isa nang mali ang tinanggal/)).toBeInTheDocument()
    expect(tile("KA (tinanggal)")).toBeDisabled()

    // Stage 3: the target is shown and a confirming tap advances the run.
    // The stage-2 guidance stays up between retries; wait for the selected
    // tile to clear its wrong-state instead.
    await waitFor(
      () =>
        expect(
          tile("KA (tinanggal)").style.backgroundImage
        ).not.toContain("R_button.png"),
      { timeout: 4000 }
    )
    await user.click(tile("LA"))
    expect(screen.getByText(/Heto ang tamang sagot: BA/)).toBeInTheDocument()

    // The confirmation is ignored while the wrong answer is still submitting.
    await waitFor(
      () => expect(tile("LA").style.backgroundImage).not.toContain("R_button.png"),
      { timeout: 4000 }
    )
    await user.click(screen.getByRole("button", { name: /Kumpirmahin/i }))
    await waitFor(
      () =>
        expect(mockGet).toHaveBeenCalledWith(
          expect.stringContaining("subLevel=pagsama&setId=2")
        ),
      { timeout: 4000 }
    )
  }, 20000)
})
