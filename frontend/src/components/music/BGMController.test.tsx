import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BGMController } from './BGMController'

const playMock = vi.fn()

class FakeAudio {
  src = ''
  loop = false
  volume = 1
  paused = true
  pause = vi.fn(() => {
    this.paused = true
  })
  play = playMock

  constructor(src?: string) {
    this.src = src ?? ''
    playMock.mockImplementation(async () => {
      this.paused = false
    })
  }
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Ana', role: 'LEARNER' } }),
}))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <BGMController />
    </MemoryRouter>
  )
}

beforeEach(() => {
  playMock.mockClear()
  localStorage.clear()
  vi.stubGlobal('Audio', FakeAudio)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('BGMController', () => {
  it('plays background music on the home page', async () => {
    renderAt('/home')

    await waitFor(() => expect(playMock).toHaveBeenCalledTimes(1))
  })

  it('does not play inside a module', async () => {
    renderAt('/modules/1')

    await new Promise((resolve) => setTimeout(resolve, 25))
    expect(playMock).not.toHaveBeenCalled()
  })
})
