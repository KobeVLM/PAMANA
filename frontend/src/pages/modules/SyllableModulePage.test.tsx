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
    mockGet.mockImplementation((url: string) =>
      Promise.resolve({
        data: url.startsWith("/syllables/set") ? makeSet() : statusData,
      })
    )
    mockPost.mockResolvedValue({ data: { nextSetId: 2 } })
  })

  it("keeps the same option set on wrong tries and reveals the hint on the third", async () => {
    const user = userEvent.setup()
    render(<SyllableModulePage />)

    await screen.findByRole("button", { name: "KA" })
    expect(tileNames()).toEqual(["BA", "KA", "LA", "MA"])

    await user.click(screen.getByRole("button", { name: "KA" }))
    expect(buttonBg("KA")).toContain("R_button.png")
    expect(screen.queryByText(/color Green/i)).not.toBeInTheDocument()
    expect(tileNames()).toEqual(["BA", "KA", "LA", "MA"])

    await waitForReset("KA")
    await user.click(screen.getByRole("button", { name: "KA" }))
    expect(screen.queryByText(/color Green/i)).not.toBeInTheDocument()

    await waitForReset("KA")
    await user.click(screen.getByRole("button", { name: "KA" }))
    expect(buttonBg("BA")).toContain("G_button.png")
    await waitForReset("KA")
    expect(screen.getByText(/color Green/i)).toBeInTheDocument()
  }, 20000)

  it("reveals the correct answer immediately and advances to the next set", async () => {
    const user = userEvent.setup()
    render(<SyllableModulePage />)

    await screen.findByRole("button", { name: "BA" })
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
