# Superapp Monorepo — Project Context for Devin

> Living document. Update this when architecture, deployment, or testing workflow changes.

## 1. Data Architecture

- **Production master:** Supabase project `peslmsctejmvkwzyohke`.
  - REST: `https://peslmsctejmvkwzyohke.supabase.co/rest/v1/`
  - DB host: `db.peslmsctejmvkwzyohke.supabase.co`
- **Local AI/test mirror:** InsForge (`packages/api` + local Postgres) on `http://localhost:3001`.
  - Cashflow (and other apps) auto-routes `.from()`/`.rpc()` to InsForge if `http://localhost:3001/health` returns 200; otherwise falls back to Supabase cloud.
- **Trial mode:** `cashflow_trial_mode_enabled` / `isTrial` / `superapp_trial_mode` localStorage flags. Uses `trialMockStore.ts` seed data (company `trial-company`, branch `trial-branch`). Data is local-only and resets on cache clear.

## 2. Deployment

- 7 Vercel projects connected to `apps/*`.
- `vercel.json` in each app now has `ignoreCommand`:
  ```json
  "ignoreCommand": "git diff --quiet HEAD^ HEAD -- . ../../packages ../../package-lock.json"
  ```
  This skips builds unless the app, shared packages, or lockfile changed.
- **Quota:** Hobby plan = 100 deployments / 24h. As of 2026-08-04 04:02 UTC the account had 164 deployments in the previous 24h, so builds were blocked until ~13:54 UTC.

## 3. Known Schema / Data Issues

- `customers.id` was `uuid` on Supabase but the app/InsForge generated string IDs (`cust-...`). This caused all customer inserts to fail during the migration.
  - **Fix applied:** migrations `040`/`041` changed `customers.id`, `transactions.id`, `bank_accounts.id`, `backup_history.id`, `color_settings.id` and related FKs to `text`.
  - **Result:** 777 unique customers synced; 75 rows were exact duplicates and kept only once.
- `nguoi_dai_dien` column is in code/import but the Supabase migration `20260527000003_add_nguoi_dai_dien_to_customers.sql` has not been applied yet.
  - **Workaround:** `bulkCreateCustomers` strips unknown columns on first failure and retries.
- Customer `customer_code` is unique per company and should be treated as the stable business key, even though the UI still has a separate `id` column.

## 4. Recent Fixes (Cashflow)

- `transformRawTransaction` now preserves `company_id`, `customer_name`, `bank_account_name`, `reference_number`, and `status` so manual transactions keep bank/branch/company linkage.
- `Settings` branch save now falls back to `companyId` / `user.company_id` / `user.branch.company_id`.
- `Settings` default active tab changed from `"interface"` to `"appearance"` so the page content renders.
- `transactionService.bulkImportTransactions` now maps display labels from bank/branch dropdowns (`Name - Number/Code`) back to real IDs before insert.

## 5. Testing Workflow

- **Unit / service:** `npm run test --workspace=apps/cashflow` (Vitest). `localFlows.test.ts` covers bank account, branch, and transaction creation in trial mode.
- **E2E / UI:** Playwright headless against local `npm run dev` on `http://localhost:5174`. Chrome browser automation is blocked by reCAPTCHA, so do not rely on it.
  - Config: `apps/cashflow/playwright.config.ts`
  - Spec: `apps/cashflow/e2e/localFlows.spec.ts`
- **Build/type check:** `npm run build --workspace=apps/cashflow` and `npm run type-check --workspace=apps/cashflow`.

## 6. Pending / Watch Items

- Dashboard `total_balance` may not update immediately after bulk opening-balance import; verify `getDashboardMetrics` / `calculateCustomerBalance`.
- Admin Portal permission assignment UI and responsive UX still under review.
- Vercel deployment will resume when the daily build quota resets.

## 7. Secrets

- `SUPABASE_DB_PASSWORD` was provided and should be stored as a Devin user secret for future migrations.
- `VITE_SUPABASE_ANON_KEY` and service-role key are in `docker-compose.yml`, `packages/api/dist/config.js`, and `apps/cashflow/.env.local`.
