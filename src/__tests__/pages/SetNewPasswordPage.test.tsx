import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import SetNewPasswordPage from '../../pages/SetNewPasswordPage'

const mockUpdatePassword = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    updatePassword: mockUpdatePassword,
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderPage() {
  return render(
    <MemoryRouter>
      <SetNewPasswordPage />
    </MemoryRouter>
  )
}

describe('SetNewPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdatePassword.mockResolvedValue(undefined)
  })

  describe('Rendering', () => {
    it('should display the heading', () => {
      renderPage()
      expect(screen.getByRole('heading', { name: /set new password/i })).toBeInTheDocument()
    })

    it('should render the logo as a link to /', () => {
      renderPage()
      expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/')
    })

    it('should render new password and confirm password inputs', () => {
      renderPage()
      expect(screen.getByPlaceholderText('New password')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument()
    })

    it('should render the submit button', () => {
      renderPage()
      expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup()
      renderPage()

      await user.type(screen.getByPlaceholderText('New password'), 'password123')
      await user.type(screen.getByPlaceholderText('Confirm new password'), 'different123')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
      expect(mockUpdatePassword).not.toHaveBeenCalled()
    })

    it('should show error when password is too short', async () => {
      const user = userEvent.setup()
      renderPage()

      await user.type(screen.getByPlaceholderText('New password'), 'short')
      await user.type(screen.getByPlaceholderText('Confirm new password'), 'short')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument()
      expect(mockUpdatePassword).not.toHaveBeenCalled()
    })
  })

  describe('Submission', () => {
    it('should call updatePassword with the new password', async () => {
      const user = userEvent.setup()
      renderPage()

      await user.type(screen.getByPlaceholderText('New password'), 'newpassword123')
      await user.type(screen.getByPlaceholderText('Confirm new password'), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      await waitFor(() => {
        expect(mockUpdatePassword).toHaveBeenCalledWith('newpassword123')
      })
    })

    it('should navigate to / on success', async () => {
      const user = userEvent.setup()
      renderPage()

      await user.type(screen.getByPlaceholderText('New password'), 'newpassword123')
      await user.type(screen.getByPlaceholderText('Confirm new password'), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/')
      })
    })

    it('should show loading state while submitting', async () => {
      mockUpdatePassword.mockImplementation(() => new Promise(() => {}))
      const user = userEvent.setup()
      renderPage()

      await user.type(screen.getByPlaceholderText('New password'), 'newpassword123')
      await user.type(screen.getByPlaceholderText('Confirm new password'), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /updating/i })).toBeInTheDocument()
      })
    })

    it('should disable inputs while submitting', async () => {
      mockUpdatePassword.mockImplementation(() => new Promise(() => {}))
      const user = userEvent.setup()
      renderPage()

      await user.type(screen.getByPlaceholderText('New password'), 'newpassword123')
      await user.type(screen.getByPlaceholderText('Confirm new password'), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('New password')).toBeDisabled()
        expect(screen.getByPlaceholderText('Confirm new password')).toBeDisabled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message on failure', async () => {
      mockUpdatePassword.mockRejectedValueOnce(new Error('Token expired'))
      const user = userEvent.setup()
      renderPage()

      await user.type(screen.getByPlaceholderText('New password'), 'newpassword123')
      await user.type(screen.getByPlaceholderText('Confirm new password'), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      await waitFor(() => {
        expect(screen.getByText('Token expired')).toBeInTheDocument()
      })
    })

    it('should re-enable the button after a failed submission', async () => {
      mockUpdatePassword.mockRejectedValueOnce(new Error('Token expired'))
      const user = userEvent.setup()
      renderPage()

      await user.type(screen.getByPlaceholderText('New password'), 'newpassword123')
      await user.type(screen.getByPlaceholderText('Confirm new password'), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update password/i })).not.toBeDisabled()
      })
    })

    it('should not navigate on failure', async () => {
      mockUpdatePassword.mockRejectedValueOnce(new Error('Token expired'))
      const user = userEvent.setup()
      renderPage()

      await user.type(screen.getByPlaceholderText('New password'), 'newpassword123')
      await user.type(screen.getByPlaceholderText('Confirm new password'), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /update password/i }))

      await waitFor(() => {
        expect(screen.getByText('Token expired')).toBeInTheDocument()
      })

      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })
})
