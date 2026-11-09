import { render, screen, fireEvent } from '@testing-library/react'
import MigrationPrompt from './index'

describe('MigrationPrompt', () => {
  const mockOnProceed = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the migration prompt', () => {
    render(<MigrationPrompt onProceed={mockOnProceed} />)

    expect(screen.getByText(/Add the multisigs you trust/i)).toBeInTheDocument()
    expect(screen.getByText(/Only multisigs you trust appear in this list/i)).toBeInTheDocument()
  })

  it('should call onProceed when "Add" button is clicked', () => {
    render(<MigrationPrompt onProceed={mockOnProceed} />)

    const selectButton = screen.getByRole('button', { name: /Choose multisigs/i })
    fireEvent.click(selectButton)

    expect(mockOnProceed).toHaveBeenCalledTimes(1)
  })

  it('should render with testid', () => {
    render(<MigrationPrompt onProceed={mockOnProceed} />)

    expect(screen.getByTestId('migration-prompt')).toBeInTheDocument()
  })
})
