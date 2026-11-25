import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"
import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import api from "@/lib/api"
import { VocabularyModulePage } from "./VocabularyModulePage"

vi.mock("@/lib/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "123e4567-e89b-12d3-a456-426614174000", name: "Test Learner", role: "LEARNER" } }),
}))

let playAudioResolve: (() => void) | null = null
const mockPlayAudio = vi.fn().mockImplementation(() => {
  return new Promise<string>((resolve) => {
    playAudioResolve = () => resolve("ended")
  })
})

vi.mock("@/contexts/AudioContext", () => ({
  useAudio: () => ({
    playAudio: mockPlayAudio,
    stopAudio: vi.fn(),
  }),
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

vi.mock("@/components/game/NPCDialogue", () => ({
  NPCDialogue: () => null,
}))

vi.mock("@/components/game/AudioPlayer", () => ({
  AudioPlayer: () => <button type="button">audio</button>,
}))

const mockWord = {
  wordId: "word-uuid-1",
  word: "mata",
  audioUrl: "/audio/mata.mp3",
  imageUrl: "/images/module2/mata.png",
  domain: "self_body",
}

const mockGamitinData = {
  wordId: "word-uuid-1",
  sentenceTemplate: "Ang aking _____ ay malinaw.",
  correctWord: "mata",
  options: ["mata", "kamay", "ilong"],
  audioUrl: "/audio/mata.mp3",
}

const mockGet = api.get as Mock
const mockPost = api.post as Mock

const skipGesture = async (user: ReturnType<typeof userEvent.setup>) => {
  const skip = screen.queryByRole("button", { name: /Skip/i })
  if (skip) await user.click(skip)
}

describe("VocabularyModulePage", () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPost.mockReset()
    playAudioResolve = null
    window.localStorage.clear()
    document.documentElement.classList.remove("pamana-focus")

    mockGet.mockImplementation((url: string) => {
      if (url.startsWith("/vocabulary/next")) {
        return Promise.resolve({ status: 200, data: mockWord })
      }
      if (url.startsWith("/vocabulary/gamitin")) {
        return Promise.resolve({ status: 200, data: mockGamitinData })
      }
      if (url.startsWith("/vocabulary/match")) {
        return Promise.resolve({
          status: 200,
          data: {
            targetWordId: "word-uuid-1",
            targetWord: "mata",
            targetImageUrl: "/images/module2/mata.png",
            targetAudioUrl: "/audio/mata.mp3",
            options: [
              { wordId: "word-uuid-1", word: "mata", imageUrl: "/images/module2/mata.png" },
              { wordId: "word-uuid-2", word: "ilong", imageUrl: "/images/module2/ilong.png" },
            ],
          },
        })
      }
      if (url.startsWith("/modules/progress")) {
        return Promise.resolve({ status: 200, data: [{ moduleNumber: 2, accuracy: 80 }] })
      }
      return Promise.resolve({ data: null })
    })

    mockPost.mockResolvedValue({ data: { success: true } })
  })

  it("turns GREEN immediately on right answer during gamitin step without turning red first", async () => {
    const user = userEvent.setup()
    render(<VocabularyModulePage moduleNumber={2} />)

    // 1. Step: pakinggan -> click Susunod
    const nextBtn = await screen.findByRole("button", { name: /susunod/i })
    await skipGesture(user)
    await user.click(nextBtn)

    // 2. Step: kilalanin -> click option matching target
    const optImage = await screen.findByAltText("mata")
    await skipGesture(user)
    const optButtonKilalanin = optImage.closest("button")!
    await user.click(optButtonKilalanin)

    // Wait for the kilalanin image cards to be replaced by text cards.
    await waitFor(
      () => expect(screen.queryByAltText("mata")).not.toBeInTheDocument(),
      { timeout: 3000 }
    )

    // Wait for step transition to basahin (1500ms timeout in handleStepSelect)
    const optButtonBasahin = await screen.findByRole("button", { name: "mata" }, { timeout: 3000 })
    await skipGesture(user)
    await user.click(optButtonBasahin)

    // Wait for step transition to gamitin (1500ms timeout in handleStepSelect)
    await screen.findByText(/Ang aking/i, {}, { timeout: 3000 })
    // Ensure gamitin options have loaded
    await waitFor(() => {
      expect(screen.queryByText("Inihahanda ang mga opsyon...")).not.toBeInTheDocument()
      expect(screen.getByRole("button", { name: "kamay" })).toBeInTheDocument()
    })

    await skipGesture(user)
    const optButtonGamitin = screen.getByRole("button", { name: "mata" })
    expect(optButtonGamitin.style.backgroundImage).toContain("Y_button.png")

    // Click the RIGHT answer
    await user.click(optButtonGamitin)

    // VERIFY: The button MUST be GREEN immediately, NOT red!
    expect(optButtonGamitin.style.backgroundImage).toContain("G_button.png")
    expect(optButtonGamitin.style.backgroundImage).not.toContain("R_button.png")
    expect(screen.getByText("Tama! Magaling!")).toBeInTheDocument()

    // Audio finishes playing
    await act(async () => {
      if (playAudioResolve) playAudioResolve()
    })

    // It should remain GREEN
    expect(optButtonGamitin.style.backgroundImage).toContain("G_button.png")
  }, 15000)

  it("turns RED on wrong answer during gamitin step", async () => {
    const user = userEvent.setup()
    render(<VocabularyModulePage moduleNumber={2} />)

    // 1. Step: pakinggan -> click Susunod
    const nextBtn = await screen.findByRole("button", { name: /susunod/i })
    await skipGesture(user)
    await user.click(nextBtn)

    // 2. Step: kilalanin -> click option matching target
    const optImage = await screen.findByAltText("mata")
    await skipGesture(user)
    const optButtonKilalanin = optImage.closest("button")!
    await user.click(optButtonKilalanin)

    // Wait for the kilalanin image cards to be replaced by text cards.
    await waitFor(
      () => expect(screen.queryByAltText("mata")).not.toBeInTheDocument(),
      { timeout: 3000 }
    )

    // Wait for step transition to basahin
    const optButtonBasahin = await screen.findByRole("button", { name: "mata" }, { timeout: 3000 })
    await skipGesture(user)
    await user.click(optButtonBasahin)

    // Wait for step transition to gamitin
    await screen.findByText(/Ang aking/i, {}, { timeout: 3000 })
    await waitFor(() => {
      expect(screen.queryByText("Inihahanda ang mga opsyon...")).not.toBeInTheDocument()
      expect(screen.getByRole("button", { name: "kamay" })).toBeInTheDocument()
    })

    await skipGesture(user)
    const wrongButton = screen.getByRole("button", { name: "kamay" })
    expect(wrongButton.style.backgroundImage).toContain("Y_button.png")

    // Click WRONG answer
    await user.click(wrongButton)

    // VERIFY: The button turns RED and stage-1 encouragement replaces the
    // generic retry message.
    expect(wrongButton.style.backgroundImage).toContain("R_button.png")
    expect(screen.getByText(/Halos nakuha mo na/)).toBeInTheDocument()
    expect(screen.queryByText(/Almost ! Try again/)).not.toBeInTheDocument()
  }, 15000)
})
