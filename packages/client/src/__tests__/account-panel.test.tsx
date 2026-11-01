import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AccountPanel from '../components/AccountPanel'
import StorefrontHeader from '../components/StorefrontHeader'
import { AuthContext, type AuthContextValue } from '../components/authContext'
import { getMe } from '../lib/api'

jest.mock('../lib/supabase/browser', () => ({ getBrowserSupabase: () => null }))
jest.mock('../lib/api', () => ({ getMe: jest.fn() }))

const getMeMock = getMe as jest.Mock

function ctx(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    configured: true,
    loading: false,
    user: { id: 'u1', email: 'thinkcoin2008@gmail.com' },
    isOps: false,
    recovering: false,
    openAuthModal: jest.fn(),
    closeAuthModal: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    sendMagicLink: jest.fn(),
    sendPasswordReset: jest.fn(),
    updatePassword: jest.fn(),
    signOut: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

const profile = {
  id: 'p1',
  email: 'thinkcoin2008@gmail.com',
  role: 'CUSTOMER',
  firstName: 'Son',
  lastName: 'Pham',
  isEmailVerified: true,
}

describe('AccountPanel', () => {
  beforeEach(() => getMeMock.mockReset())

  it('shows email, first, last and full name from the profile', async () => {
    getMeMock.mockResolvedValue(profile)
    render(<AccountPanel onClose={jest.fn()} />)
    expect(await screen.findByText('thinkcoin2008@gmail.com')).toBeInTheDocument()
    expect(screen.getByText('Son')).toBeInTheDocument()
    expect(screen.getByText('Pham')).toBeInTheDocument()
    expect(screen.getByText('Son Pham')).toBeInTheDocument()
    expect(screen.getByText('Verified')).toBeInTheDocument()
  })

  it('shows a dash for a name the profile does not have yet', async () => {
    getMeMock.mockResolvedValue({ ...profile, firstName: '', lastName: '' })
    render(<AccountPanel onClose={jest.fn()} />)
    await screen.findByText('thinkcoin2008@gmail.com')
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3)
  })

  it('reports a failed load instead of showing stale fields', async () => {
    getMeMock.mockRejectedValue(new Error('down'))
    render(<AccountPanel onClose={jest.fn()} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your account details')
  })

  it('closes on Escape', async () => {
    getMeMock.mockResolvedValue(profile)
    const onClose = jest.fn()
    render(<AccountPanel onClose={onClose} />)
    await screen.findByText('Son Pham')
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})

describe('StorefrontHeader account button', () => {
  const props = { searchQuery: '', onSearch: jest.fn(), totalCartCount: 0, onOpenCart: jest.fn() }

  it('opens the account details when the signed-in email is clicked', async () => {
    getMeMock.mockResolvedValue(profile)
    render(
      <AuthContext.Provider value={ctx()}>
        <StorefrontHeader {...props} />
      </AuthContext.Provider>
    )
    const button = screen.getByRole('button', { name: 'thinkcoin2008@gmail.com' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByRole('dialog', { name: 'Account details' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Son Pham')).toBeInTheDocument())
  })
})
