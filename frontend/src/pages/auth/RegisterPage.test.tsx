import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RegisterPage } from './RegisterPage'

const mockRegister = vi.fn()
let mockUser: unknown = null

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
    user: mockUser,
  }),
}))

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = null
    localStorage.clear()
  })

  it('renders Step 1 form with Role, Username, Password, Confirm Password, but NO Name or Email', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /join the quest!/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /learner/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /parent/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/adventurer_juan/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()

    // Ensure Name and Email inputs are NOT present in Step 1
    expect(screen.queryByLabelText(/^name$/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/^email$/i)).not.toBeInTheDocument()
  })

  it('validates username length and format', async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(await screen.findByText('Username is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()

    // Less than 3 chars
    fireEvent.change(screen.getByLabelText(/^username$/i), { target: { value: 'ab' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    expect(await screen.findByText('Username must be at least 3 characters.')).toBeInTheDocument()

    // Invalid characters (e.g. spaces or symbols)
    fireEvent.change(screen.getByLabelText(/^username$/i), { target: { value: 'bad username!' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    expect(await screen.findByText('Username can only contain letters, numbers, and underscores.')).toBeInTheDocument()
  })

  it('validates password minimum length and confirmation match', async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/^username$/i), { target: { value: 'valid_user' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: '123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    expect(await screen.findByText('Password must be at least 6 characters.')).toBeInTheDocument()
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
  })

  it('opens AdventurerOnboardingModal when step 1 is valid, and completes registration', async () => {
    mockRegister.mockResolvedValueOnce(undefined)

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<div>Login Page Target</div>} />
        </Routes>
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/^username$/i), { target: { value: 'tala_hero' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // AdventurerOnboardingModal should now be open
    expect(await screen.findByText('Create Your Adventurer!')).toBeInTheDocument()
    expect(screen.getByText('1. Choose your character')).toBeInTheDocument()

    // Choose Girl (Babae) character
    const girlBtn = screen.getByRole('button', { name: /select girl character/i })
    fireEvent.click(girlBtn)

    // Type Adventurer Name
    const nameInput = screen.getByPlaceholderText('e.g. Juan dela Cruz or Captain Maria')
    fireEvent.change(nameInput, { target: { value: 'Tala Gabriela' } })

    // Click Begin Adventure!
    fireEvent.click(screen.getByRole('button', { name: /begin adventure!/i }))

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        'tala_hero',
        'password123',
        'LEARNER',
        'Tala Gabriela',
        'Babae'
      )
    })

    expect(localStorage.getItem('show_intro_story')).toBe('true')
    expect(await screen.findByText('Login Page Target')).toBeInTheDocument()
  })

  it('handles 409 Conflict error by closing modal and showing duplicate username message', async () => {
    const error409 = {
      response: {
        status: 409,
        data: { message: 'Ang username na ito ay may rehistradong account na.' },
      },
    }
    mockRegister.mockRejectedValueOnce(error409)

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/^username$/i), { target: { value: 'already_taken' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    expect(await screen.findByText('Create Your Adventurer!')).toBeInTheDocument()

    const nameInput = screen.getByPlaceholderText('e.g. Juan dela Cruz or Captain Maria')
    fireEvent.change(nameInput, { target: { value: 'Juan' } })
    fireEvent.click(screen.getByRole('button', { name: /begin adventure!/i }))

    // Modal should close and conflict error message should display
    await waitFor(() => {
      expect(
        screen.getByText('That username is already registered. Please choose another.')
      ).toBeInTheDocument()
    })
    expect(screen.queryByText('Create Your Adventurer!')).not.toBeInTheDocument()
  })
})
