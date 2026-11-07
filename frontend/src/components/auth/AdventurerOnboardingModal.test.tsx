import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AdventurerOnboardingModal } from './AdventurerOnboardingModal'

describe('AdventurerOnboardingModal', () => {
  it('renders modal with title, character choices, and name input', () => {
    render(<AdventurerOnboardingModal open={true} onComplete={vi.fn()} />)

    expect(screen.getByText('Create Your Adventurer!')).toBeInTheDocument()
    expect(screen.getByText('Customize your character to begin your journey.')).toBeInTheDocument()
    expect(screen.getByText('1. Choose your character')).toBeInTheDocument()
    expect(screen.getByText('2. What is your name?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /select boy character/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /select girl character/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. Juan dela Cruz or Captain Maria')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /begin adventure!/i })).toBeInTheDocument()
  })

  it('allows switching character gender between Boy and Girl', () => {
    render(<AdventurerOnboardingModal open={true} onComplete={vi.fn()} initialGender="Lalaki" />)

    const boyBtn = screen.getByRole('button', { name: /select boy character/i })
    const girlBtn = screen.getByRole('button', { name: /select girl character/i })

    expect(boyBtn).toHaveAttribute('aria-pressed', 'true')
    expect(girlBtn).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(girlBtn)

    expect(girlBtn).toHaveAttribute('aria-pressed', 'true')
    expect(boyBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('validates that adventurer name is not empty on submit', async () => {
    const handleComplete = vi.fn()
    render(<AdventurerOnboardingModal open={true} onComplete={handleComplete} />)

    const submitBtn = screen.getByRole('button', { name: /begin adventure!/i })
    fireEvent.click(submitBtn)

    expect(await screen.findByText('Please enter your adventurer name.')).toBeInTheDocument()
    expect(handleComplete).not.toHaveBeenCalled()
  })

  it('submits trimmed name and selected gender successfully', async () => {
    const handleComplete = vi.fn().mockResolvedValue(undefined)
    render(
      <AdventurerOnboardingModal
        open={true}
        onComplete={handleComplete}
        initialGender="Babae"
      />
    )

    const input = screen.getByPlaceholderText('e.g. Juan dela Cruz or Captain Maria')
    fireEvent.change(input, { target: { value: '  Captain Maria  ' } })

    const submitBtn = screen.getByRole('button', { name: /begin adventure!/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(handleComplete).toHaveBeenCalledWith({
        name: 'Captain Maria',
        gender: 'Babae',
      })
    })
  })

  it('displays loading state when isLoading is true', () => {
    render(
      <AdventurerOnboardingModal
        open={true}
        onComplete={vi.fn()}
        isLoading={true}
      />
    )

    const submitBtn = screen.getByRole('button', { name: /begin adventure!/i })
    expect(submitBtn).toBeDisabled()
    expect(screen.getByPlaceholderText('e.g. Juan dela Cruz or Captain Maria')).toBeDisabled()
  })
})
