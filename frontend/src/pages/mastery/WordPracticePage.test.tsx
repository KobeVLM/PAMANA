import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import api from "@/lib/api"
import { WordPracticePage } from "./WordPracticePage"

const { mockNavigate, mockReplay, mockPlayWrong } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockReplay: vi.fn(),
  mockPlayWrong: vi.fn(),
}))

vi.mock("@/lib/api", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1, name: "Test Learner", role: "LEARNER" } }),
}))

vi.mock("@/contexts/AudioContext", () => ({
  useAudio: () => ({ stopAudio: vi.fn() }),
}))

vi.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate }))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock("@/hooks/useGameAudio", () => ({
  useAudioElement: () => ({ replay: mockReplay }),
  useSfx: () => ({ playWrong: mockPlayWrong }),
}))
vi.mock("@/components/game/NPCDialogue", () => ({ NPCDialogue: () => null }))
vi.mock("@/components/game/AudioPlayer", () => ({
  AudioPlayer: () => <button type="button">audio</button>,
}))

const words = ["mata", "kamay", "ilong", "bibig", "tenga"].map((word, i) => ({
  wordId: `w-${i}`,
  word,
  domain: "self_body",
  audioUrl: `/audio/${word}.mp3`,
  imageUrl: `/images/${word}.png`,
  ordinal: i,
}))

const mockGet = api.get as Mock
const mockPost = api.post as Mock

describe("WordPracticePage", () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
    mockPost.mockResolvedValue({ data: {} })
    window.localStorage.clear()
    document.documentElement.classList.remove("pamana-focus")
    mockGet.mockImplementation((url: string) => {
      if (url.startsWith("/modules/progress/")) {
        return Promise.resolve({ data: [{ moduleNumber: 2, isComplete: true }] })
      }
      if (url === "/vocabulary/all") return Promise.resolve({ data: words })
      if (url.startsWith("/vocabulary/match/")) {
        return Promise.resolve({
          data: {
            targetWordId: "w-0",
            options: [
              { wordId: "w-0", word: "mata" },
              { wordId: "w-1", word: "kamay" },
              { wordId: "w-2", word: "ilong" },
              { wordId: "w-3", word: "bibig" },
            ],
          },
        })
      }
      return Promise.resolve({ data: null })
    })
  })

  it("gates answers with the gesture demo and keeps the HUD in Focus View", async () => {
    const user = userEvent.setup()
    render(<WordPracticePage />)

    await screen.findByRole("button", { name: "mata" })
    expect(screen.getByRole("button", { name: "mata" })).toBeDisabled()
    expect(screen.getByText("Tap the correct answer")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Skip/i }))
    expect(screen.getByRole("button", { name: "mata" })).toBeEnabled()
    expect(screen.getByRole("progressbar")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Buksan ang Focus View/i }))
    expect(document.documentElement).toHaveClass("pamana-focus")
    expect(screen.getByRole("progressbar")).toBeInTheDocument()
  })

  it("shows stage-1 guidance on a wrong answer", async () => {
    const user = userEvent.setup()
    render(<WordPracticePage />)

    await screen.findByRole("button", { name: "mata" })
    await user.click(screen.getByRole("button", { name: /Skip/i }))
    await user.click(screen.getByRole("button", { name: "kamay" }))

    expect(screen.getByText(/Halos nakuha mo na/)).toBeInTheDocument()
    expect(screen.queryByText(/Almost ! Try again/)).not.toBeInTheDocument()
    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith(
        "/answer-events",
        expect.objectContaining({ correct: false, activity: "practice" })
      )
    )
  })
})
