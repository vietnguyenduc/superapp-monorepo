---
app: <APP_NAME>
doc_type: ROLES-PERMISSIONS
---

# <APP_NAME> — Roles & Permissions

## User roles

- `ADMIN_MASTER` (`admin_master`)
- `ADMIN_COMPANY` (`admin_company`)
- `STAFF` (`staff`)

## Permissions

Define in `src/types/UserRole.ts` or `src/utils/rbac.ts`.

## Enforcement

- `hasPermission(user, Permission.XXX)` in UI.
- Route/menu guards.
- RLS is the final authority.
