# Superapp Monorepo — Project Context for Devin

> Living document. Update this when architecture, deployment, or testing workflow changes.

## 1. Data Architecture

- **Production master:** Supabase project `peslmsctejmvkwzyohke`.
  - REST: `https://peslmsctejmvkwzyohke.supabase.co/rest/v1/`
  - DB host: `db.peslmsctejmvkwzyohke.supabase.co`
- **Local AI/test mirror:** `packages/api` (Fastify, port 3001) + local Postgres.
  - Apps auto-route `.from()`/`.rpc()` to the local API if `http://localhost:3001/health` returns 200; otherwise fall back to Supabase cloud.
- **Trial mode:** `cashflow_trial_mode_enabled` / `isTrial` / `superapp_trial_mode` localStorage flags. Uses `trialMockStore.ts` seed data (company `trial-company`, branch `trial-branch`). Data is local-only and resets on cache clear.
- **Id type:** `customers.id`, `transactions.id`, `bank_accounts.id`, `branches.id` and related FKs are `text` containing v4 UUID strings (`crypto.randomUUID()`), not `uuid` type. See migration `041_customers_id_text.sql`.

## 2. Deployment

- 7 Vercel projects connected to `apps/*` (admin-portal, cashflow, inventory-operation, sales-operation, hr-operation, accounting, operations-portal).
- `vercel.json` in each app has `ignoreCommand` to skip builds unless the app, shared packages, or lockfile changed.
- `framework-method` (`https://framework.appforyou.xyz`) is a separate personal project, not one of the 7 Superapp production apps.
- `apps/insforge-infra/` is Docker infrastructure for local AI tooling, not deployed to Vercel.
- `apps/superapp-business-bot/` is a deprecated leftover (only `config/settings.json`, no `package.json`).

## 3. Stack

- **Frontend:** React 18 + TypeScript 5.8 + Vite 8 + Tailwind CSS (Apple-inspired).
- **Backend:** Supabase cloud (`peslmsctejmvkwzyohke`) — PostgreSQL + RLS + Auth + Storage + Realtime.
- **API:** Fastify (`packages/api`, port 3001), not Express.
- **Shared packages:** `@superapp/iam` (auth + multi-tenant context), `@superapp/shared-utils` (BaseService, createApiClient), `@repo/ui`, `@superapp/theme`, `@repo/types`, etc.
- **Node:** Vite 8 / Rolldown require Node `^20.19.0 || >=22.12.0`; the current sandbox uses Node 20.18.1, so builds emit a Node-version warning but succeed.

## 4. Static Checks

Run repo-wide static checks before opening / merging a PR:

```bash
npx turbo run check-types   # type-check all packages
npx turbo run lint          # lint all packages
npx turbo run test          # unit tests
npx turbo run build         # production build
```

After the React 18 / TypeScript 5.8 alignment and missing transitive-dependency fixes, all four commands pass for all 7 Superapp apps and shared packages.

## 5. Recent Fixes / Changes

### Docs alignment (2026-08-15)

- Standardized repo on React 18 + TypeScript 5.8 (`@repo/ui`, `operations-portal`, and shared packages updated).
- Fixed `turbo` `check-types`/`lint`/`test`/`build` configuration drift and missing transitive dependencies (`local-pkg`, `@rolldown/binding-linux-x64-gnu`, `void-elements`, `css-box-model`, `memoize-one`, `raf-schd`, `react-redux`, `redux`, `use-memo-one`, chai transitive deps, `url-parse` family, `deep-equal`, `recharts-scale` family).
- Generated the standard 12-file doc set for the 7 Superapp apps.
- Added `docs/NEW-APP-TEMPLATE/` and `tools/new-app-generator/` (HTML app) for scaffolding new apps.
- Added `tools/doc-audit/generate_app_docs.py` and `tools/doc-audit/audit_docs.py` to keep app docs in sync with source.

### Cashflow data integrity

- `transactionService` recalculates `total_balance`/`current_balance` from `opening_balance + Σ(amount × math_factor)` of all completed transactions.
- Migration `20260804000004_balance_recalc_trigger.sql` added a trigger that recalculates balances on transaction changes and backfilled existing data.
- `CustomerDetailModal` shows `Tổng số tiền mua hàng` and `Tổng số tiền đã trả` (payment + deposit + adjustment).

### Supabase schema health

- `20260804000001_approval_logs_company_id_and_rls.sql` added `company_id` and tenant-scoped policies to `approval_logs`.
- `20260804000002_child_table_rls_policies.sql` added `company_id` and parent-join policies to 15 high-risk child tables.
- `20260804000003_special_outbound_records_notes_and_reason_detail.sql` added missing columns and aligned payloads.
- `20260804000004_balance_recalc_trigger.sql` added balance recalculation triggers on `transactions`/`bank_accounts`.

## 6. Testing Workflow

- **Unit / service:** `npx turbo run test --filter=<app>` (Vitest).
- **E2E / UI:** Playwright headless against local `npm run dev` or production URL. Chrome automation may be blocked by reCAPTCHA; use Playwright with trial mode or pre-authenticated sessions.
- **Doc coverage:** `python3 tools/doc-audit/audit_docs.py` reports missing / stale docs.

## 7. Pending / Watch Items

- Vercel deployment quota resets periodically; preview/production deploys resume automatically.
- Some `supabase/migrations/` historical filenames (`007`, `008`, `034`–`036`, `045`–`047`) do not match remote migration history; use `npx supabase migration repair` before `db push` when applying new migrations.
- `color_settings`, `product_column_presets`, `companies`, and `user_preferences` remain global/user-scoped by design.

## 8. Secrets

- `SUPABASE_DB_PASSWORD` should be stored as a Devin user/org secret for future migrations.
- `VITE_SUPABASE_ANON_KEY` and service-role key live in Vercel env, `docker-compose.yml`, and per-app `.env` files. Do not commit them.
