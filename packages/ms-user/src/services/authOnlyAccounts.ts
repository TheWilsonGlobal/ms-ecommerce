import type { FastifyBaseLogger } from 'fastify'
import type { UserRole } from '@ecommerce/shared-types'
import type { PublicUser } from '../userMapping'
import { SupabaseAuthError, type AdminUserSummary, type SupabaseAuth } from '../supabase'

const PAGE_SIZE = 200
const MAX_PAGES = 50
const USER_ROLES: readonly UserRole[] = ['ADMIN', 'VENDOR', 'CUSTOMER']

/**
 * Every Supabase Auth account. Returns [] when the Admin API is unavailable, so the
 * admin list falls back to profile rows alone instead of failing.
 */
export async function listAuthAccounts(
  supabase: SupabaseAuth,
  log: FastifyBaseLogger
): Promise<AdminUserSummary[]> {
  const accounts: AdminUserSummary[] = []
  try {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const batch = await supabase.admin.listUsers(page, PAGE_SIZE)
      accounts.push(...batch)
      if (batch.length < PAGE_SIZE) break
    }
  } catch (err) {
    log.warn(
      { providerError: err instanceof SupabaseAuthError ? err.kind : 'unknown' },
      'user_list.auth_accounts_unavailable'
    )
    return []
  }
  return accounts
}

/** An account with no profile row yet: a sign-up that never reached the user service. */
export function isLinked(
  account: AdminUserSummary,
  profiles: readonly { authUserId: string | null; email: string }[]
): boolean {
  return profiles.some(
    (p) =>
      p.authUserId === account.id || (account.email !== null && p.email === account.email)
  )
}

/**
 * Read-only view of an account that has no profile. Nothing is written: the row
 * appears once the user signs in through the user service, or on a backfill.
 * Edit and delete need a profile, so they fail for these rows.
 */
export function authOnlyUser(account: AdminUserSummary): PublicUser {
  const email = account.email ?? ''
  const role = account.appRole && (USER_ROLES as readonly string[]).includes(account.appRole)
  return {
    id: account.id,
    email,
    firstName: email.split('@')[0] ?? '',
    lastName: '',
    phoneNumber: null,
    role: role ? (account.appRole as UserRole) : 'CUSTOMER',
    isActive: true,
    isEmailVerified: account.emailConfirmed,
    addresses: [],
    createdAt: account.createdAt ?? new Date(0).toISOString(),
  }
}
