---
name: testing-cashflow-admin-portal
description: Run the Cashflow and Admin Portal apps locally on a Devin VM and test dashboard metrics, trial-mode data scoping, and Admin Portal role/permission gating end-to-end through the UI. Use when verifying dashboard or admin-navigation changes in this monorepo.
---

# Testing Cashflow + Admin Portal locally

AGENTS.md assumes dev servers run on the user's WSL box (`http://100.83.130.115:5173-5178`). A Devin VM cannot reach
those. Run the apps on the VM instead and use `http://localhost:<port>` (Cashflow `5174`, Admin Portal `5173`).
Vercel previews may be unavailable (this repo has hit the free `api-deployments-free-per-day` limit of 100/day,
which surfaces as `Resource is limited - try again in 24 hours` on every check) — plan for local verification.

## Setup

1. `npm install` at the repo root (the snapshot may lack `node_modules`, so `vite`/`tsc`/`eslint` won't exist).
   If Vite fails with `Cannot find module '@rolldown/binding-linux-x64-gnu'`, install that optional package explicitly.
2. Each app needs `apps/<app>/.env.local` with `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
   (values come from the session's `SUPABASE_URL` / `SUPABASE_ANON_KEY` env vars). These files are temporary —
   delete them before finishing, and never commit them.
3. The Supabase service-role key is available in `docker-compose.yml` (`SUPABASE_SERVICE_ROLE_KEY` under the `api` service). It can be used for auth admin operations and direct REST seeding/cleanup when full user/data lifecycle control is needed.
4. `npx turbo run dev --filter=cashflow` / `--filter=admin-portal`, or `npm run dev -w <app>`.
   A `Vite requires Node.js version 20.19+` warning may appear and can be ignored if the server starts; mention it
   as a caveat in the report.
5. If the `computer` tool cannot type into web form inputs, fall back to a temporary Playwright script attached to
   the running local dev server to fill and submit login forms, while the desktop recording continues.

## Cashflow trial mode (no login needed)

- `/login` → button `Dùng thử ngay (không cần đăng nhập)` puts the app in trial mode with seeded data
  (10 customers, 15 transactions, 8 bank accounts, 1 branch, all `company_id = "trial-company"`).
- Seed expectations at the time of writing: `Tổng công nợ = -584.400.000`, `Khách hàng hoạt động = 10`,
  debtors-first list from `-89.500.000` down to `-35.500.000`. Recompute from
  `apps/cashflow/src/services/mockData.ts` rather than trusting these numbers if the seeds change.
- The trial store lives in `localStorage["cashflow_trial_store"]`, but it is **only written after a mutation** —
  right after entering trial mode the key can be absent and the store exists only in memory. To manipulate trial data,
  first create something through the UI (e.g. "Thêm khách hàng mới"), which persists the whole store, then edit the
  JSON in localStorage and reload.
- Testing multi-tenant scoping without a second login: create a customer through the UI, then flip its
  `company_id` to a foreign value in the persisted store and reload. Do it in both directions (in-scope first, then
  out-of-scope) so the screenshots prove the metric actually reacts to the record.
- `browser_console` returns `undefined` for scripts that start with `const`/`let` — wrap the snippet in an IIFE
  (`(()=>{ ... return JSON.stringify(x); })()`) to get a value back.

## Admin Portal role/permission testing

- There is no trial/mock login; you need real Supabase users. Anon-key signup works and is enough:
  1. `POST $SUPABASE_URL/auth/v1/signup` with `apikey: $SUPABASE_ANON_KEY` to create the auth user.
  2. Sign in via `/auth/v1/token?grant_type=password`, then `POST $SUPABASE_URL/rest/v1/users` with the returned
     access token to insert the `public.users` row carrying `role` (`admin_master`, `admin_company`, …).
     No `handle_new_user` trigger seems to populate this row, and the app reads the role from `public.users`.
  3. **Record the email and password you used somewhere durable** — losing them means creating yet another user.
- Cleanup is limited without a service-role key: you can delete the `public.users` row with the user's own token,
  but `auth.users` records will remain. List the leftover emails in the report and ask the user to delete them.
- The desktop sidebar `Logout` button can be pushed below the viewport (the `aside` is taller than the window and the
  page doesn't scroll). Reliable alternative: shrink the window (`wmctrl -r :ACTIVE: -e 0,50,30,520,760`) to trigger
  the mobile bottom nav, tap `+ More`, and use `Logout` in the "More Options" drawer. This doubles as the responsive
  check that role filtering also applies to the mobile nav/drawer.
- Check permission gating on three surfaces, not just one: desktop sidebar, mobile bottom nav + drawer, and direct
  URL entry (`localhost:5173/companies` should redirect a non-master admin to `/reports`).
- Re-maximize before recording: `wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz`.

## Cleanup checklist

- Delete `apps/*/.env.local`; confirm `git status --porcelain` is empty.
- Kill the Vite processes.
- Delete/report temporary Supabase users. With the service-role key you can delete auth users via
  `$SUPABASE_URL/auth/v1/admin/users/<id>` (list users with `GET` then `DELETE`), not only the `public.users` row.

## Devin Secrets Needed

- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — required for both apps' `.env.local` and for creating test users.
- `SUPABASE_ACCESS_TOKEN` — present but was **not** accepted by `api.supabase.com` (`Unauthorized`), so don't rely on
  the Management API for SQL.
- A Supabase **service-role key** is available in `docker-compose.yml` under the `api` service (`SUPABASE_SERVICE_ROLE_KEY`);
  use it to create/delete temporary auth users and to seed/cleanup data via the REST API.
- `VERCEL_TOKEN` — only useful for preview verification, which may be blocked by the daily deployment quota.
