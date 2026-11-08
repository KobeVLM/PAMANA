import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setupCheats, unlockModule, unlockAllModules } from './cheats'
import api from './api'

vi.mock('./api', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('cheats module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('registers cheat functions on window', () => {
    setupCheats()
    expect(typeof window.unlockModule).toBe('function')
    expect(typeof window.unlockModule1).toBe('function')
    expect(typeof window.unlockModule2).toBe('function')
    expect(typeof window.unlockModule3).toBe('function')
    expect(typeof window.unlockModule4).toBe('function')
    expect(typeof window.unlockAllModules).toBe('function')
    expect(typeof window.unlockAll).toBe('function')
    expect(typeof window.pamana.unlock).toBe('function')
    expect(typeof window.cheat.unlock).toBe('function')
  })

  it('warns when user is not logged in', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await unlockModule(2, { reload: false })
    expect(api.post).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('calls api.post when unlocking individual module', async () => {
    sessionStorage.setItem('pamana_user', JSON.stringify({ id: 'test-user-id', name: 'Student 1' }))
    ;(api.post as any).mockResolvedValueOnce({ data: [] })

    await unlockModule(2, { reload: false })

    expect(api.post).toHaveBeenCalledWith('/modules/unlock/test-user-id/2')
  })

  it('calls api.post when unlocking all modules', async () => {
    sessionStorage.setItem('pamana_user', JSON.stringify({ id: 'test-user-id', name: 'Student 1' }))
    ;(api.post as any).mockResolvedValueOnce({ data: [] })

    await unlockAllModules({ reload: false })

    expect(api.post).toHaveBeenCalledWith('/modules/unlock-all/test-user-id', null, {
      params: { markComplete: false },
    })
  })
})
