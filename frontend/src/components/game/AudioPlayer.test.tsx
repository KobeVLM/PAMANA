import { beforeEach, describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AudioPlayer } from "./AudioPlayer"

const { playAudioMock, postMock, audioState } = vi.hoisted(() => ({
  playAudioMock: vi.fn(),
  postMock: vi.fn(),
  audioState: {
    isAudioPlaying: false,
    currentAudioUrl: null as string | null,
  },
}))

vi.mock("@/contexts/AudioContext", () => ({
  useAudio: () => ({
    playAudio: playAudioMock,
    isAudioPlaying: audioState.isAudioPlaying,
    currentAudioUrl: audioState.currentAudioUrl,
  }),
}))

vi.mock("@/lib/api", () => ({ default: { post: postMock } }))

describe("AudioPlayer", () => {
  beforeEach(() => {
    playAudioMock.mockReset()
    playAudioMock.mockResolvedValue("ended")
    postMock.mockReset()
    postMock.mockResolvedValue({ data: {} })
    audioState.isAudioPlaying = false
    audioState.currentAudioUrl = null
  })

  it("logs a replay only when the learner taps, not on autoplay", async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <AudioPlayer audioUrl="/audio/words/mata.mp3" autoPlay />
    )

    await waitFor(() => expect(playAudioMock).toHaveBeenCalledTimes(1))
    expect(postMock).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: /Pakinggan/i }))
    expect(playAudioMock).toHaveBeenCalledTimes(2)
    expect(postMock).toHaveBeenCalledWith(
      "/replay-events",
      expect.objectContaining({ itemType: "target_audio", source: "target" })
    )

    audioState.isAudioPlaying = true
    audioState.currentAudioUrl = "/audio/words/mata.mp3"
    rerender(<AudioPlayer audioUrl="/audio/words/mata.mp3" />)
    expect(screen.getByRole("button", { name: /Pakinggan/i })).toHaveAttribute(
      "data-speaking",
      "true"
    )
  })

  it("keeps the target replay at least 56px tall", () => {
    render(<AudioPlayer audioUrl="/audio/words/mata.mp3" />)

    const button = screen.getByRole("button", { name: /Pakinggan/i })
    expect(button.className).toContain("w-14")
    expect(button.className).toContain("animate-pulse-glow")
  })
})
