# Changelog — Cashflow

## 2026-08-05

### Fixed

- **Sign-aware transaction amounts** — `balanceMath.ts` now multiplies the type's default impact by `Math.sign(amount)`, so negative amounts reverse the transaction direction instead of being silently absoluted. Applied to bulk import, manual edit, balance sync, and dashboard aggregates.
- **Vietnamese validation messages** — `validation.ts` returns user-facing errors in Vietnamese, fixing the English "Lỗi cấu hình" banner when saving bank accounts.
- **Stale modal errors** — `Settings.tsx` resets `error` when opening or canceling modals.
- **Dashboard active customers** — counts `customers.is_active !== false` instead of unique `customer_id` values in the current transaction window.
- **Customer list summary** — uses `formatCurrency` (exact number) and counts from the full `allCustomers` list.
- **Customer table responsive UX** — compact columns, sticky headers, horizontal scroll indicator, and mobile-safe pagination.
- **Search with special characters** — `customerService.getCustomers` and `transactionService.getTransactions` quote `ilike` values so searches containing `,`, `(`, `)`, `.`, `=` no longer cause PostgREST `PGRST100` errors.
- **Backup/restore robustness** — browser-safe compression (`TextEncoder`/`btoa`), restore column whitelist, per-record error reporting, and correct opening-balance reset to avoid double-counted balances after restore.
- **Export Excel** — matches the current customer table view (search, sort, and visible columns) and keeps amounts as numbers.

### Added

- `scripts/deploy-app.sh` and `scripts/deploy-changed-apps.sh` for on-demand, single-app / changed-app-only Vercel CLI deploys.
- `.github/workflows/deploy-changed-apps.yml` as an optional `workflow_dispatch` deployment path.
- `scripts/vercel-ignore.sh` now skips every preview build that is not the `viet` branch to preserve free Vercel quota.

### Docs

- Updated `AI-CONTEXT.md`, `DATA-FLOW.md`, and ADRs to reflect sign-aware balance math and the minimal-deployment strategy.
