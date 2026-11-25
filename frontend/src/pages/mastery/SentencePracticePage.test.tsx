import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import api from "@/lib/api"
import { SentencePracticePage } from "./SentencePracticePage"

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

vi.mock("@/hooks/useGameAudio", () => ({
  useAudioElement: () => ({ replay: mockReplay }),
  useSfx: () => ({ playWrong: mockPlayWrong }),
}))

vi.mock("@/components/game/NPCDialogue", () => ({ NPCDialogue: () => null }))
vi.mock("@/components/game/AudioPlayer", () => ({
  AudioPlayer: () => <button type="button">audio</button>,
}))

const task = {
  taskId: "task-1",
  scrambledWords: ["ay", "pusa", "Ang", "mabait"],
  correctOrder: ["Ang", "pusa", "ay", "mabait"],
  audioUrl: "/audio/task-1.mp3",
  tier: 1,
  completed: false,
}

const mockGet = api.get as Mock
const mockPost = api.post as Mock
const submit = () => screen.getByRole("button", { name: "Isumite" })
const retry = () => screen.getByRole("button", { name: /Subukan Ulit/i })

describe("SentencePracticePage", () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
    window.localStorage.clear()
    document.documentElement.classList.remove("pamana-focus")
    mockGet.mockImplementation((url: string) => {
      if (url.startsWith("/modules/progress/")) {
        return Promise.resolve({ data: [{ moduleNumber: 4, isComplete: true }] })
      }
      if (url.startsWith("/sentences/task")) {
        return Promise.resolve({ status: 200, data: task })
      }
      return Promise.resolve({ data: null })
    })
    mockPost.mockResolvedValue({ data: {} })
  })

  it("gates tile ordering with the gesture demo and keeps the HUD in Focus View", async () => {
    const user = userEvent.setup()
    render(<SentencePracticePage />)

    await screen.findByRole("group", { name: /Mga salita ng pangungusap/i })
    const angButton = await screen.findByText("Ang")
    const angTile = () => angButton.closest("button") as HTMLButtonElement
    expect(angTile()).toBeDisabled()
    expect(
      screen.getByText("Tap two words to swap their order")
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Skip/i }))
    expect(angTile()).toBeEnabled()

    await user.click(screen.getByRole("button", { name: /Buksan ang Focus View/i }))
    expect(document.documentElement).toHaveClass("pamana-focus")
    expect(screen.getByRole("progressbar")).toBeInTheDocument()
  })

  it("pins a word at stage 2 and confirms the answer at stage 3", async () => {
    const user = userEvent.setup()
    render(<SentencePracticePage />)

    await screen.findByRole("group", { name: /Mga salita ng pangungusap/i })
    await user.click(screen.getByRole("button", { name: /Skip/i }))

    // Stage 1: encouragement with a replay, no answer revealed.
    await user.click(submit())
    expect(screen.getByText(/Halos nakuha mo na/)).toBeInTheDocument()
    expect(screen.queryByText("Ang pusa ay mabait")).not.toBeInTheDocument()

    // Stage 2: one word is pinned in place and cannot be swapped out.
    await user.click(retry())
    await user.click(submit())
    expect(screen.getByText(/Isang salita ang naitama na/)).toBeInTheDocument()
    const pinned = screen.getByRole("button", { name: "Ang (naka-lock)" })
    expect(pinned).toBeDisabled()

    // Stage 3: the full sentence is compared and can be confirmed.
    await user.click(retry())
    await user.click(submit())
    expect(screen.getByText(/Heto ang tamang sagot: Ang pusa ay mabait/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Kumpirmahin/i }))
    expect(screen.getByText(/Tama! Napakahusay!/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Susunod/i })).toBeInTheDocument()
  }, 20000)
})
