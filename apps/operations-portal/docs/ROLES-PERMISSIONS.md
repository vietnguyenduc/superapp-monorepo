---
app: operations-portal
doc_type: ROLES-PERMISSIONS
generated: true
---

# operations-portal — Roles & Permissions

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## User roles

- See `src/types/UserRole.ts` or `src/utils/rbac.ts`.

## Permissions

- Permission mapping not discovered; inspect RBAC files.

## Role → permission mapping

- See RBAC implementation in `src/types/UserRole.ts` or `src/utils/rbac.ts`.

## Enforcement

- Use `hasPermission(user, Permission.XXX)` before enabling UI actions.
- Route guards and menu items hide options the user cannot perform.
- RLS is the final guard in Supabase; app-side checks are for UX only.

