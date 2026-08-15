---
app: accounting
doc_type: ROLES-PERMISSIONS
generated: true
---

# accounting — Roles & Permissions

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## User roles

- `ADMIN_MASTER` (`admin_master`)
- `ADMIN_COMPANY` (`admin_company`)
- `ADMIN` (`admin`)
- `BRANCH_MANAGER` (`branch_manager`)
- `STAFF` (`staff`)

## Permissions

- `DASHBOARD_VIEW` (`dashboard.view`)
- `DASHBOARD_EXPORT` (`dashboard.export`)
- `CUSTOMERS_VIEW` (`customers.view`)
- `CUSTOMERS_CREATE` (`customers.create`)
- `CUSTOMERS_EDIT` (`customers.edit`)
- `CUSTOMERS_DELETE` (`customers.delete`)
- `CUSTOMERS_EXPORT` (`customers.export`)
- `CUSTOMERS_IMPORT` (`customers.import`)
- `CUSTOMERS_MANAGE` (`customers.manage`)
- `TRANSACTIONS_VIEW` (`transactions.view`)
- `TRANSACTIONS_CREATE` (`transactions.create`)
- `TRANSACTIONS_EDIT` (`transactions.edit`)
- `TRANSACTIONS_DELETE` (`transactions.delete`)
- `TRANSACTIONS_EXPORT` (`transactions.export`)
- `TRANSACTIONS_IMPORT` (`transactions.import`)
- `TRANSACTIONS_ADD_ONLY` (`transactions.add_only`)
- `TRANSACTIONS_NO_EDIT` (`transactions.no_edit`)
- `TRANSACTIONS_MANAGE` (`transactions.manage`)
- `IMPORT_TRANSACTIONS` (`import.transactions`)
- `IMPORT_CUSTOMERS` (`import.customers`)
- `USERS_VIEW` (`users.view`)
- `USERS_CREATE` (`users.create`)
- `USERS_EDIT` (`users.edit`)
- `USERS_DELETE` (`users.delete`)
- `USERS_CREATE_ANY_ROLE` (`users.create_any_role`)
- `COMPANIES_VIEW` (`companies.view`)
- `COMPANIES_CREATE` (`companies.create`)
- `COMPANIES_EDIT` (`companies.edit`)
- `COMPANIES_DELETE` (`companies.delete`)
- `COMPANIES_VIEW_ALL` (`companies.view_all`)
- `BRANCHES_VIEW` (`branches.view`)
- `BRANCHES_CREATE` (`branches.create`)
- `BRANCHES_EDIT` (`branches.edit`)
- `BRANCHES_DELETE` (`branches.delete`)
- `BRANCHES_VIEW_ALL` (`branches.view_all`)
- `BANK_ACCOUNTS_VIEW` (`bank_accounts.view`)
- `BANK_ACCOUNTS_CREATE` (`bank_accounts.create`)
- `BANK_ACCOUNTS_EDIT` (`bank_accounts.edit`)
- `BANK_ACCOUNTS_DELETE` (`bank_accounts.delete`)
- `REPORTS_VIEW` (`reports.view`)
- `REPORTS_EXPORT` (`reports.export`)
- `REPORTS_SCHEDULE` (`reports.schedule`)
- `SETTINGS_MANAGE_SYSTEM` (`settings.manage_system`)
- `SETTINGS_MANAGE_COMPANY` (`settings.manage_company`)

## Role → permission mapping

Mapping defined in `apps/accounting/src/utils/rbac.ts`.

## Enforcement

- Use `hasPermission(user, Permission.XXX)` before enabling UI actions.
- Route guards and menu items hide options the user cannot perform.
- RLS is the final guard in Supabase; app-side checks are for UX only.

