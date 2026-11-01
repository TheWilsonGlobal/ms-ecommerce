/**
 * Role-based access control data: permissions are `resource:action[:scope]` strings,
 * the role -> permissions map lives HERE, in code, reviewed in pull requests.
 * (If admins ever need to edit it at runtime, move this map to a table with the
 * same keys; the enforcement code does not change.)
 *
 * Scope convention: a bare permission (`orders:read`) means "my own records";
 * the `:any` variant (`orders:read:any`) means any record. The route policy
 * names the bare permission; handlers that load a record call
 * `requireOwnerOrAny` to apply the ownership rule.
 *
 * Lives in shared-types (pure data, no runtime deps) so the admin UI can render
 * the same matrix the API enforces. shared-security re-exports it for enforcement.
 */
export const PERMISSIONS = [
  // catalogue
  'products:write', // create/update/delete a product (VENDOR: own products only)
  'products:write:any',
  'categories:write',
  'uploads:write',
  'storage:read',
  // orders and payments
  'orders:create',
  'orders:read',
  'orders:read:any',
  'orders:update', // cancel / change status of an order
  'orders:update:any',
  'payments:capture',
  'payments:capture:any',
  'saga:report',
  // users
  'users:read', // my own profile
  'users:read:any',
  'users:update', // my own profile (never role / status)
  'users:update:any',
  'users:create',
  'users:update:role',
  'users:update:status',
  'users:delete',
  // back-office views
  'inventory:read',
  'analytics:read',
  // operator surface: logs, schema, queues, cache, events, outbox, topology
  'ops:read',
  'ops:write',
] as const

export type Permission = (typeof PERMISSIONS)[number]

/** Every role the RBAC map covers. SERVICE is a machine identity, never a person. */
export const RBAC_ROLES = ['ADMIN', 'VENDOR', 'CUSTOMER', 'SERVICE'] as const
export type RbacRole = (typeof RBAC_ROLES)[number]

const CUSTOMER: readonly Permission[] = [
  'orders:create',
  'orders:read',
  'orders:update',
  'payments:capture',
  'users:read',
  'users:update',
]

const VENDOR: readonly Permission[] = [
  ...CUSTOMER,
  'products:write',
  'uploads:write',
  'storage:read', // read-only: listing/downloading objects; never storage write
  'inventory:read',
  'analytics:read',
]

const ADMIN: readonly Permission[] = [...PERMISSIONS]

/**
 * SERVICE tokens are for machine calls and are deliberately narrow: they can
 * read what another service legitimately needs and nothing that changes a user
 * or touches the operator surface.
 */
const SERVICE: readonly Permission[] = ['orders:read:any', 'inventory:read', 'saga:report']

export const ROLE_PERMISSIONS: Readonly<Record<RbacRole, ReadonlySet<Permission>>> = {
  ADMIN: new Set(ADMIN),
  VENDOR: new Set(VENDOR),
  CUSTOMER: new Set(CUSTOMER),
  SERVICE: new Set(SERVICE),
}
