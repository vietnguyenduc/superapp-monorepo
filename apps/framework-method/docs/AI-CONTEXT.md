# Framework Method — AI Context

## Architecture

- `apps/framework-method/src/main.tsx` wraps `<App />` with `<AuthProvider>` from `@superapp/iam` and a local `ThemeProvider`.
- `src/services/supabase.ts` uses `createSupabaseClient` from `@superapp/shared-utils` and the shared Supabase project (`peslmsctejmvkwzyohke.supabase.co`).
- Auth is email/password only; SSO cross-app works via `detectSessionInUrl` and `AppSwitcher` links with `access_token`/`refresh_token`.
- Routes are protected by `ProtectedRoute`; unauthenticated users land on `/login`.
- Trial mode: `Login.tsx` has a `Dùng thử không cần tài khoản` button. It calls `startTrial()` from `@superapp/iam` and navigates to `/dashboard`. `ProtectedRoute` now checks `isAuthenticated` (which is `true` for trial users) instead of only `session`, so trial users can access protected routes.
- Port: 5179 (dev), `dist` (build output), `vercel.json` ready for Vercel deployment.

## Design Tokens

- Font: Inter
- Primary: `#2563eb`
- Accent: violet/purple (`violet-600`)
- Card: rounded-2xl, subtle shadow, white/light gray background
- Dark mode toggles `html.dark` class, persisted in `localStorage` as `fm-theme`.

## DB Schema

Migration `supabase/migrations/20260527000004_framework_method_schema.sql` creates tables prefixed with `fm_` to avoid collisions in the shared Supabase project:

`fm_profiles`, `fm_frameworks`, `fm_templates`, `fm_phases`, `fm_steps`, `fm_blocks`, `fm_user_template`, `fm_user_progress`, `fm_step_responses`, `fm_actions`, `fm_reflections`, `fm_daily_goals`, `fm_sessions`, `fm_streaks`.

The generated `@repo/types` `Database` type does **not** contain the new `fm_*` tables. `frameworkMethodService.ts` therefore casts the Supabase client to a runtime `db` wrapper (`{ from: (table: string) => any }`) and relies on local `Template`/`TemplateSection`/`DailyTask`/etc. types. This keeps `tsc -p tsconfig.app.json --noEmit` green while the generated types are not regenerated.

RLS is enabled on all tables. Users see rows where `user_id = auth.uid()`. Published templates (`status = 'published'`) are readable publicly.

## Product Decisions

- The canonical 4-step flow and 6 locked decisions (carry-over, per-task apply/track, non-linear sessions, variable builder items, all-time insights, pin-as-reminder) are documented in `apps/framework-method/docs/PRD-framework-method.md`.
- New code/refactors for the 4-step flow should start from that PRD and keep the existing screens (Dashboard, Overview, Actions, Evening, Calendar, History, Builder) as shells that are re-wired to the new data model.

## Implementation Notes (refactor)

- `SessionProvider` is mounted in `App.tsx` around the protected `<Layout />`. It owns blocks, tasks, session state, streak, apply plans, tracks, and reference inputs.
- `/session` route renders `SessionPage` (4 steps: Lên việc / Nhận ra / Đưa khuôn / Bám). Old `/step/:stepId` route has been removed.
- `Dashboard` and `Overview` "Bắt đầu phiên" / "Start Session" buttons navigate to `/session`.
- `BottomNav` steps icon now links to `/session`.
- `Builder` has been rewritten to edit `TemplateSection` + `TemplateSectionItem` per block and per step. It initializes from `DEFAULT_BLOCKS` and `DEFAULT_TEMPLATES` in `frameworkMethodService` so the UI is usable even if Supabase `fm_*` tables are not present yet.
- `i18n/locales/vi.json` and `en.json` contain `session.*` and `builder.*` keys for the new flow.
- `frameworkMethodService.ts` still logs errors to `console.warn` in fallback paths and supplies default blocks, suggestions, and templates when DB queries fail.
- `SessionContext` hook order: `persistSession` and `setCurrentBlockIndex` are declared before `loadData` so `loadData` can safely reference them without a TDZ/`Cannot access before initialization` runtime error.
- `i18n` is initialized with `lng: "vi"` and `fallbackLng: "vi"` so the app defaults to Vietnamese. `common.back` was added to both locale files.
- `packages/shared-utils` unused imports (`exportToFile`, `templateData`, `SupabaseClient`, `Database`) were removed so that `tsc -p apps/framework-method/tsconfig.app.json --noEmit` does not fail on cross-package `noUnusedLocals`.
