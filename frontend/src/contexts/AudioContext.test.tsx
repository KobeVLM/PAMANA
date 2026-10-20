import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AudioProvider, useAudio, type PlaybackResult } from './AudioContext'

class FakeAudio {
  static instances: FakeAudio[] = []
  src = ''
  currentTime = 0
  volume = 1
  preload = ''
  paused = true
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  play = vi.fn(async () => {
    this.paused = false
  })
  pause = vi.fn(() => {
    this.paused = true
  })

  constructor() {
    FakeAudio.instances.push(this)
  }

  end() {
    this.onended?.()
  }

  fail() {
    this.onerror?.()
  }
}

class FakeUtterance {
  text: string
  lang = ''
  rate = 1
  volume = 1
  voice: unknown = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(text: string) {
    this.text = text
  }
}

type AudioApi = ReturnType<typeof useAudio>

function Harness({ onReady }: { onReady: (api: AudioApi) => void }) {
  const api = useAudio()
  useEffect(() => {
    onReady(api)
  }, [api, onReady])
  return <span>{api.isAudioPlaying ? 'playing' : 'idle'}</span>
}

function setup() {
  let api: AudioApi | null = null
  render(
    <MemoryRouter>
      <AudioProvider>
        <Harness
          onReady={(value) => {
            api = value
          }}
        />
      </AudioProvider>
    </MemoryRouter>
  )
  return () => {
    if (!api) throw new Error('Audio context was not ready')
    return api
  }
}

beforeEach(() => {
  FakeAudio.instances = []
  vi.stubGlobal('Audio', FakeAudio)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  Reflect.deleteProperty(window, 'speechSynthesis')
})

describe('AudioProvider', () => {
  it('stops the current clip when a new one starts', async () => {
    const getApi = setup()

    let first!: Promise<PlaybackResult>
    act(() => {
      first = getApi().playAudio('/audio/words/mata.mp3')
    })
    const firstAudio = FakeAudio.instances.at(-1)!

    act(() => {
      void getApi().playAudio('/audio/words/kamay.mp3')
    })

    await expect(first).resolves.toBe('interrupted')
    expect(firstAudio.pause).toHaveBeenCalled()
    expect(FakeAudio.instances.at(-1)!.play).toHaveBeenCalled()
  })

  it('reports ended and clears the playing state when the clip finishes', async () => {
    const getApi = setup()

    let promise!: Promise<PlaybackResult>
    act(() => {
      promise = getApi().playAudio('/audio/words/mata.mp3')
    })
    expect(screen.getByText('playing')).toBeInTheDocument()

    act(() => {
      FakeAudio.instances.at(-1)!.end()
    })

    await expect(promise).resolves.toBe('ended')
    await waitFor(() => expect(screen.getByText('idle')).toBeInTheDocument())
  })

  it('interrupts playback when stopAudio is called', async () => {
    const getApi = setup()

    let promise!: Promise<PlaybackResult>
    act(() => {
      promise = getApi().playAudio('/audio/words/mata.mp3')
    })
    act(() => {
      getApi().stopAudio()
    })

    await expect(promise).resolves.toBe('interrupted')
    expect(FakeAudio.instances.at(-1)!.pause).toHaveBeenCalled()
  })

  it('speaks fallback text when the clip cannot be loaded', async () => {
    const speak = vi.fn()
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        cancel: vi.fn(),
        getVoices: () => [{ lang: 'fil-PH' }],
        speak,
      },
    })
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
    const getApi = setup()

    let promise!: Promise<PlaybackResult>
    act(() => {
      promise = getApi().playAudio('/audio/words/laro.mp3', {
        fallbackText: 'laro',
      })
    })

    act(() => {
      FakeAudio.instances.at(-1)!.fail()
    })

    expect(speak).toHaveBeenCalledTimes(1)
    const utterance = speak.mock.calls[0][0] as FakeUtterance
    expect(utterance.text).toBe('laro')
    expect(utterance.lang).toBe('fil-PH')

    act(() => {
      utterance.onend?.()
    })

    await expect(promise).resolves.toBe('ended')
    Reflect.deleteProperty(window, 'speechSynthesis')
  })
})
