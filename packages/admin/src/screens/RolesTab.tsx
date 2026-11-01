import { PERMISSIONS, RBAC_ROLES, ROLE_PERMISSIONS } from '@ecommerce/shared-types'

// Read-only view of the RBAC matrix the API enforces. It comes from the same module
// (packages/shared/types/src/rbac.ts), so the table cannot drift from the backend.
export default function RolesTab() {
  return (
    <>
      <div className="page-header">
        <div className="page-title">
          Roles & Permissions <span className="tag">{PERMISSIONS.length} permissions</span>
        </div>
      </div>

      <p style={{ color: 'var(--text-faint)', margin: '0 0 16px' }}>
        A role is granted a permission when its cell is checked. The source is
        packages/shared/types/src/rbac.ts, and the API enforces the same map.
      </p>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Permission</th>
              {RBAC_ROLES.map((role) => (
                <th key={role} style={{ textAlign: 'center' }}>
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((permission) => (
              <tr key={permission}>
                <td>
                  <code>{permission}</code>
                </td>
                {RBAC_ROLES.map((role) => {
                  const granted = ROLE_PERMISSIONS[role].has(permission)
                  return (
                    <td key={role} style={{ textAlign: 'center' }}>
                      {granted ? (
                        <span style={{ color: 'var(--success, #22c55e)' }}>✓</span>
                      ) : (
                        <span style={{ color: 'var(--text-faint)' }}>—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
