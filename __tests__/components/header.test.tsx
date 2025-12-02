import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from '@/components/header'

// Mock the useAuth hook
const mockSignOut = jest.fn()
const mockUseAuth = jest.fn()

jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render logo and app name', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signOut: mockSignOut,
    })

    render(<Header />)
    
    expect(screen.getByText('FamilyNotify')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /FamilyNotify/i })).toHaveAttribute('href', '/')
  })

  it('should show login and signup buttons when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signOut: mockSignOut,
    })

    render(<Header />)
    
    expect(screen.getByRole('link', { name: 'התחברות' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'הרשמה' })).toBeInTheDocument()
  })

  it('should show navigation menu when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
      loading: false,
      signOut: mockSignOut,
    })

    render(<Header />)
    
    expect(screen.getByRole('link', { name: 'הודעות' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'אירועים' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'העדפות' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'ניהול' })).toBeInTheDocument()
  })

  it('should show user email in dropdown when authenticated', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
      loading: false,
      signOut: mockSignOut,
    })

    render(<Header />)
    
    // Click on the user icon button
    const userButton = screen.getByRole('button', { name: '' })
    await user.click(userButton)
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('should call signOut when logout is clicked', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
      loading: false,
      signOut: mockSignOut,
    })

    render(<Header />)
    
    // Click on the user icon button
    const userButton = screen.getByRole('button', { name: '' })
    await user.click(userButton)
    
    // Click on logout
    const logoutButton = screen.getByText('התנתק')
    await user.click(logoutButton)
    
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })

  it('should not render navigation when loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      signOut: mockSignOut,
    })

    render(<Header />)
    
    expect(screen.queryByRole('link', { name: 'התחברות' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'הרשמה' })).not.toBeInTheDocument()
  })

  it('should have correct links for authenticated user', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
      loading: false,
      signOut: mockSignOut,
    })

    render(<Header />)
    
    expect(screen.getByRole('link', { name: 'הודעות' })).toHaveAttribute('href', '/feed')
    expect(screen.getByRole('link', { name: 'אירועים' })).toHaveAttribute('href', '/events')
    expect(screen.getByRole('link', { name: 'העדפות' })).toHaveAttribute('href', '/preferences')
    expect(screen.getByRole('link', { name: 'ניהול' })).toHaveAttribute('href', '/admin')
  })
})


