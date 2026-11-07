import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from './LoginPage'

const mockLogin = vi.fn()
let mockUser: unknown = null

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: mockUser,
  }),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = null
  })

  it('renders login form elements with Username input', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /welcome back!/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/adventurer_juan/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^log in$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /register here/i })).toBeInTheDocument()
  })

  it('prefills username and password from location state (registeredUsername)', () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/login',
            state: { registeredUsername: 'juan_hero', registeredPassword: 'secret123' },
          },
        ]}
      >
        <LoginPage />
      </MemoryRouter>
    )

    expect(screen.getByLabelText(/username/i)).toHaveValue('juan_hero')
    expect(screen.getByLabelText(/^password$/i)).toHaveValue('secret123')
  })

  it('prefills username from location state backwards-compatible registeredEmail fallback', () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/login',
            state: { registeredEmail: 'legacy_user', registeredPassword: 'secret123' },
          },
        ]}
      >
        <LoginPage />
      </MemoryRouter>
    )

    expect(screen.getByLabelText(/username/i)).toHaveValue('legacy_user')
  })

  it('shows error if submitted with empty fields', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /^log in$/i }))

    expect(await screen.findByText('Please fill in all fields.')).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('calls login with username and password on submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined)

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'maria_brave' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'mypassword' } })
    fireEvent.click(screen.getByRole('button', { name: /^log in$/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('maria_brave', 'mypassword')
    })
  })

  it('shows error fallback message on failed login', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid'))

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'maria_brave' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByRole('button', { name: /^log in$/i }))

    expect(
      await screen.findByText('Invalid username or password. Please try again.')
    ).toBeInTheDocument()
  })
})
