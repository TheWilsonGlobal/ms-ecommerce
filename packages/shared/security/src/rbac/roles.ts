import { PERMISSIONS, ROLE_PERMISSIONS, type Permission } from '@ecommerce/shared-types'
import type { AuthIdentity, Role } from '../types'

// The permission list and role map are data shared with the admin UI, so they
// live in @ecommerce/shared-types. This module keeps the enforcement helpers.
export { PERMISSIONS, ROLE_PERMISSIONS, type Permission }

export function roleHas(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission)
}

export function identityHas(identity: AuthIdentity | null, permission: Permission): boolean {
  return identity !== null && roleHas(identity.role, permission)
}

/** `orders:read` -> `orders:read:any`, when that permission exists. */
export function anyVariant(permission: Permission): Permission | null {
  const candidate = `${permission}:any` as Permission
  return (PERMISSIONS as readonly string[]).includes(candidate) ? candidate : null
}
