import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { User } from '@/types'
import { ModuleRouteGuard } from './ModuleRouteGuard'

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  },
}))

const mockUser: User = {
  id: 'learner-123',
  username: 'juan123',
  name: 'Juan',
  email: 'juan@test.com',
  role: 'LEARNER',
}

let mockAuthContext: { user: User | null; isLoading: boolean } = {
  user: mockUser,
  isLoading: false,
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}))

describe('ModuleRouteGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthContext = {
      user: mockUser,
      isLoading: false,
    }
  })

  const renderWithRouter = (moduleNumber: number) => {
    return render(
      <MemoryRouter initialEntries={[`/modules/${moduleNumber}`]}>
        <Routes>
          <Route
            path={`/modules/${moduleNumber}`}
            element={
              <ModuleRouteGuard moduleNumber={moduleNumber}>
                <div>Protected Module {moduleNumber} Content</div>
              </ModuleRouteGuard>
            }
          />
          <Route path="/trail" element={<div>Trail Map Page</div>} />
        </Routes>
      </MemoryRouter>
    )
  }

  it('renders children when the module is unlocked in progress data', async () => {
    ;(api.get as Mock).mockResolvedValueOnce({
      data: [
        { moduleNumber: 1, isUnlocked: true, isComplete: true },
        { moduleNumber: 2, isUnlocked: true, isComplete: false },
      ],
    })

    renderWithRouter(2)

    expect(await screen.findByText('Protected Module 2 Content')).toBeInTheDocument()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('redirects to /trail and triggers toast when the module is locked (isUnlocked: false)', async () => {
    ;(api.get as Mock).mockResolvedValueOnce({
      data: [
        { moduleNumber: 1, isUnlocked: true, isComplete: false },
        { moduleNumber: 2, isUnlocked: false, isComplete: false },
      ],
    })

    renderWithRouter(2)

    expect(await screen.findByText('Trail Map Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Module 2 Content')).not.toBeInTheDocument()
    expect(toast.error).toHaveBeenCalledWith(
      'Naka-lock pa ang Module 2. Tapusin muna ang naunang aralin!'
    )
  })

  it('shows loading indicator while progress is being fetched', () => {
    ;(api.get as Mock).mockReturnValue(new Promise(() => {}))

    renderWithRouter(2)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Sinusuri ang estado ng module...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Module 2 Content')).not.toBeInTheDocument()
  })

  it('defaults Module 1 to unlocked if no record is found in progress data', async () => {
    ;(api.get as Mock).mockResolvedValueOnce({
      data: [],
    })

    renderWithRouter(1)

    expect(await screen.findByText('Protected Module 1 Content')).toBeInTheDocument()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('allows Module 1 as fallback when progress API call fails', async () => {
    ;(api.get as Mock).mockRejectedValueOnce(new Error('Network error'))

    renderWithRouter(1)

    expect(await screen.findByText('Protected Module 1 Content')).toBeInTheDocument()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('redirects to /trail and triggers toast when progress API fails for locked module', async () => {
    ;(api.get as Mock).mockRejectedValueOnce(new Error('Network error'))

    renderWithRouter(3)

    expect(await screen.findByText('Trail Map Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Module 3 Content')).not.toBeInTheDocument()
    expect(toast.error).toHaveBeenCalledWith(
      'Naka-lock pa ang Module 3. Tapusin muna ang naunang aralin!'
    )
  })

  it('shows loading indicator if user is not yet loaded', () => {
    mockAuthContext = {
      user: null,
      isLoading: true,
    }

    renderWithRouter(1)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Sinusuri ang estado ng module...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Module 1 Content')).not.toBeInTheDocument()
  })
})
