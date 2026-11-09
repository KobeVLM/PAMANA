import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsPage } from './SettingsPage'
import type { User } from '@/types'

const mockUpdateProfile = vi.fn().mockResolvedValue({} as User)
let mockUser: User | null = null

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    updateProfile: mockUpdateProfile,
  }),
}))

vi.mock('@/components/layout/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="app-shell">{children}</div>,
}))

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUser = {
      id: 'student-id-123',
      username: 'juan_adventurer',
      name: 'Juan Dela Cruz',
      email: null,
      role: 'LEARNER',
      gender: 'Lalaki',
    }
  })

  it('renders profile cards with name, username, and role', () => {
    render(<SettingsPage />)

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument()

    expect(screen.getByText('Username')).toBeInTheDocument()
    expect(screen.getByText('juan_adventurer')).toBeInTheDocument()

    expect(screen.getByText('Role')).toBeInTheDocument()
    expect(screen.getByText('learner')).toBeInTheDocument()
  })

  it('renders email placeholder section with "No email linked yet" and disabled button', () => {
    render(<SettingsPage />)

    expect(screen.getByText('Email Address')).toBeInTheDocument()
    expect(screen.getByText('No email linked yet')).toBeInTheDocument()
    expect(
      screen.getByText('Optional — Account recovery via email is coming soon in a future update.')
    ).toBeInTheDocument()

    const addEmailBtn = screen.getByRole('button', { name: /\+ Add Email/i })
    expect(addEmailBtn).toBeInTheDocument()
    expect(addEmailBtn).toBeDisabled()
  })

  it('displays user email when user has an email linked', () => {
    mockUser = {
      id: 'student-id-456',
      username: 'maria_explorer',
      name: 'Maria Clara',
      email: 'maria@example.com',
      role: 'LEARNER',
      gender: 'Babae',
    }

    render(<SettingsPage />)

    expect(screen.getByText('Email Address')).toBeInTheDocument()
    expect(screen.getByText('maria@example.com')).toBeInTheDocument()
    expect(screen.queryByText('No email linked yet')).not.toBeInTheDocument()
  })

  it('syncs character selection to state, localStorage, and calls updateProfile', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    render(<SettingsPage />)

    const girlButton = screen.getByRole('button', { name: /Girl \(Babae\)/i })
    fireEvent.click(girlButton)

    expect(localStorage.getItem('pamana_character')).toBe('Babae')
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'pamana_settings_changed' }))
    expect(mockUpdateProfile).toHaveBeenCalledWith('Juan Dela Cruz', 'Babae')

    const boyButton = screen.getByRole('button', { name: /Boy \(Lalaki\)/i })
    fireEvent.click(boyButton)

    expect(localStorage.getItem('pamana_character')).toBe('Lalaki')
    expect(mockUpdateProfile).toHaveBeenCalledWith('Juan Dela Cruz', 'Lalaki')
  })

  it('renders student ID card for LEARNER role and copies ID', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    })

    render(<SettingsPage />)

    expect(screen.getByText(/Student ID \(For Parent Linking\)/i)).toBeInTheDocument()
    expect(screen.getByText('student-id-123')).toBeInTheDocument()

    const copyBtn = screen.getByRole('button', { name: /Kopyahin/i })
    fireEvent.click(copyBtn)

    expect(writeTextMock).toHaveBeenCalledWith('student-id-123')
  })

  it('toggles audio preferences and updates localStorage', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    render(<SettingsPage />)

    const bgmToggle = screen.getByText('Background Music').closest('div')!.parentElement!.querySelector('button')!
    fireEvent.click(bgmToggle)

    expect(localStorage.getItem('pamana_bgm')).toBe('false')
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'pamana_settings_changed' }))

    const sfxToggle = screen.getByText('Sound Effects').closest('div')!.parentElement!.querySelector('button')!
    fireEvent.click(sfxToggle)

    expect(localStorage.getItem('pamana_sfx')).toBe('false')
  })
})
