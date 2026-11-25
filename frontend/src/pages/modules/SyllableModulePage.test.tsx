import type { ReactNode } from "react"
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import api from "@/lib/api"
import { SyllableModulePage } from "./SyllableModulePage"

vi.mock("@/lib/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1, name: "Test Learner", role: "LEARNER" } }),
}))

vi.mock("@/contexts/AudioContext", () => ({
  useAudio: () => ({ stopAudio: vi.fn() }),
}))

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock("@/hooks/useGameAudio", () => ({
  useAudioElement: () => ({ replay: vi.fn() }),
  useSfx: () => ({ playWrong: vi.fn(), playCorrect: vi.fn() }),
}))

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

vi.mock("@/components/practice/PracticePageLayout", () => ({
  PracticePageLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/components/game/NPCDialogue", () => ({
  NPCDialogue: () => null,
}))

vi.mock("@/components/game/AudioPlayer", () => ({
  AudioPlayer: () => <button type="button">audio</button>,
}))

const statusData = {
  pagsamaAccuracy: 0,
  pakingganAccuracy: 0,
  kilalaninAccuracy: 0,
  rhymingAccuracy: 0,
  module1Accuracy: 0,
  module2Unlocked: false,
  overallAccuracy: 0,
  isComplete: false,
}

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

const tileNames = () =>
  screen
    .getAllByRole("button", { name: /^(BA|KA|LA|MA)$/ })
    .map((tile) => tile.getAttribute("aria-label"))

const buttonBg = (name: string) =>
  screen.getByRole("button", { name }).style.backgroundImage

const waitForReset = (name: string) =>
  waitFor(
    () =>
      expect(
        screen.getByRole("button", { name }).style.backgroundImage
      ).not.toContain("R_button.png"),
    { timeout: 4000 }
  )

describe("SyllableModulePage", () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
    window.localStorage.clear()
    document.documentElement.classList.remove("pamana-focus")
    mockGet.mockImplementation((url: string) =>
      Promise.resolve({
        data: url.startsWith("/syllables/set") ? makeSet() : statusData,
      })
    )
    mockPost.mockResolvedValue({ data: { nextSetId: 2 } })
  })

  it("keeps the same option set on wrong tries, fades one, then asks for confirmation", async () => {
    const user = userEvent.setup()
    render(<SyllableModulePage />)

    await screen.findByRole("button", { name: "KA" })
    // The two-second hand demonstration gates the first interaction.
    await user.click(screen.getByRole("button", { name: /Skip/i }))
    expect(tileNames()).toEqual(["BA", "KA", "LA", "MA"])

    // Attempt 1: gentle encouragement, no answer revealed.
    await user.click(screen.getByRole("button", { name: "KA" }))
    expect(buttonBg("KA")).toContain("R_button.png")
    expect(screen.getByText(/Halos nakuha mo na/)).toBeInTheDocument()
    expect(tileNames()).toEqual(["BA", "KA", "LA", "MA"])

    // Attempt 2: one wrong choice is faded and disabled.
    await waitForReset("KA")
    await user.click(screen.getByRole("button", { name: "KA" }))
    expect(screen.getByText(/Isa nang mali ang tinanggal/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "KA (tinanggal)" })).toBeDisabled()

    // Attempt 3: side-by-side comparison and a confirming tap. KA is faded,
    // so the retry uses a different (still active) distractor.
    await waitFor(
      () =>
        expect(screen.getByRole("button", { name: "LA" })).not.toBeDisabled(),
      { timeout: 3000 }
    )
    await user.click(screen.getByRole("button", { name: "LA" }))
    expect(buttonBg("BA")).toContain("G_button.png")
    expect(screen.getByText(/Heto ang tamang sagot: BA/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /Kumpirmahin/i }))
    await waitFor(
      () =>
        expect(mockGet).toHaveBeenCalledWith(
          expect.stringContaining("/syllables/set?subLevel=pagsama&setId=2")
        ),
      { timeout: 4000 }
    )
  }, 20000)

  it("keeps the progress bar visible while Focus View hides scenery", async () => {
    render(<SyllableModulePage />)

    await screen.findByRole("button", { name: /Buksan ang Focus View/i })
    expect(screen.getByRole("progressbar")).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole("button", { name: /Buksan ang Focus View/i })
    )

    expect(document.documentElement).toHaveClass("pamana-focus")
    expect(
      screen.getByRole("button", { name: /Lumabas sa Focus View/i })
    ).toHaveAttribute("aria-pressed", "true")
    // The HUD is not marked decorative, so it survives Focus View.
    expect(screen.getByRole("progressbar")).toBeInTheDocument()
  })

  it("reveals the correct answer immediately and advances to the next set", async () => {
    const user = userEvent.setup()
    render(<SyllableModulePage />)

    await screen.findByRole("button", { name: "BA" })
    await user.click(screen.getByRole("button", { name: /Skip/i }))
    await user.click(screen.getByRole("button", { name: "BA" }))

    const correct = screen.getByRole("button", { name: "BA" })
    expect(correct.style.backgroundImage).toContain("G_button.png")
    expect(correct).toBeDisabled()

    await waitFor(
      () =>
        expect(mockGet).toHaveBeenCalledWith(
          expect.stringContaining("/syllables/set?subLevel=pagsama&setId=2")
        ),
      { timeout: 4000 }
    )
  }, 20000)
})
