import { authOnlyUser, isLinked } from '../services/authOnlyAccounts'

const account = (over: Partial<Parameters<typeof authOnlyUser>[0]> = {}) => ({
  id: 'auth-1',
  email: 'hello123@gmail.com',
  appRole: null,
  emailConfirmed: false,
  createdAt: '2026-10-01T00:00:00.000Z',
  ...over,
})

describe('isLinked', () => {
  it('links an account to a profile by auth user id', () => {
    expect(isLinked(account(), [{ authUserId: 'auth-1', email: 'other@x.io' }])).toBe(true)
  })

  it('links an account to a profile by e-mail when the id is not stored', () => {
    expect(isLinked(account(), [{ authUserId: null, email: 'hello123@gmail.com' }])).toBe(true)
  })

  it('reports an account with no profile as unlinked', () => {
    expect(isLinked(account(), [{ authUserId: 'auth-9', email: 'sontdhh@gmail.com' }])).toBe(false)
  })
})

describe('authOnlyUser', () => {
  it('shows an unconfirmed, role-less account as an active, unverified CUSTOMER', () => {
    const user = authOnlyUser(account())
    expect(user).toMatchObject({
      id: 'auth-1',
      email: 'hello123@gmail.com',
      firstName: 'hello123',
      role: 'CUSTOMER',
      isActive: true,
      isEmailVerified: false,
      addresses: [],
    })
  })

  it('keeps a valid app_role and marks confirmed accounts verified', () => {
    const user = authOnlyUser(account({ appRole: 'VENDOR', emailConfirmed: true }))
    expect(user.role).toBe('VENDOR')
    expect(user.isEmailVerified).toBe(true)
  })

  it('ignores an app_role that is not a human role', () => {
    expect(authOnlyUser(account({ appRole: 'SERVICE' })).role).toBe('CUSTOMER')
  })
})
