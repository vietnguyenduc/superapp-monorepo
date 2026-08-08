# Framework Method — AI Context

## Architecture

- `apps/framework-method/src/main.tsx` wraps `<App />` with `<AuthProvider>` from `@superapp/iam` and a local `ThemeProvider`.
- `src/services/supabase.ts` uses `createSupabaseClient` from `@superapp/shared-utils` and the shared Supabase project (`peslmsctejmvkwzyohke.supabase.co`).
- Auth is email/password only; SSO cross-app works via `detectSessionInUrl` and `AppSwitcher` links with `access_token`/`refresh_token`.
- Routes are protected by `ProtectedRoute`; unauthenticated users land on `/login`.
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

RLS is enabled on all tables. Users see rows where `user_id = auth.uid()`. Published templates (`status = 'published'`) are readable publicly.

## Product Decisions
- The canonical 4-step flow and 6 locked decisions (carry-over, per-task apply/track, non-linear sessions, variable builder items, all-time insights, pin-as-reminder) are documented in `apps/framework-method/docs/PRD-framework-method.md`.
- New code/refactors for the 4-step flow should start from that PRD and keep the existing screens (Dashboard, Overview, Actions, Evening, Calendar, History, Builder) as shells that are re-wired to the new data model.
