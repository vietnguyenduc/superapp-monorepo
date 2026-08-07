# Framework Method — AI Context

## Architecture

- `apps/framework-method/src/main.tsx` wraps `<App />` with `<AuthProvider>` from `@superapp/iam` and a local `ThemeProvider`.
- `src/services/supabase.ts` uses `createSupabaseClient` from `@superapp/shared-utils` and the shared Supabase project (`peslmsctejmvkwzyohke.supabase.co`).
- Auth is email/password only; SSO cross-app works via `detectSessionInUrl` and `AppSwitcher` links with `access_token`/`refresh_token`.
- Routes are protected by `ProtectedRoute`; unauthenticated users land on `/login`.
- Port: 5179 (dev), `dist` (build output), `vercel.json` ready for Vercel deployment.
- See `OVERVIEW.md` for the agreed local → Vercel preview → production verification process.

## Design Tokens

- Font: Inter
- Primary: `#2563eb`
- Accent: violet/purple (`violet-600`)
- Card: rounded-2xl, subtle shadow, white/light gray background
- Dark mode toggles `html.dark` class, persisted in `localStorage` as `fm-theme`.

## Layout / Navigation

- `Layout.tsx` renders `MobileHeader` + `BottomNav` on mobile (`md:hidden`) and `Navigation` on desktop (`hidden md:block`).
- `Navigation.tsx` (desktop) shows the app logo + horizontal links to Dashboard/Overview, Steps, Calendar, History, Builder, plus theme toggle and user menu.
- `BottomNav.tsx` (mobile) is a 5-tab fixed bottom nav.
- The global `Actions` tab was removed; committed actions and reflections are now per-task inside `TaskReview`.

## Task-first flow

- `Dashboard` = `Overview`: the single place to see today's tasks, add a task, and edit group names/colors.
- Creating a task opens `/task/:taskId`, which runs the shared `Daily Mix` framework as a step-by-step wizard.
- Each task has its own `TaskRun` in `FrameworkProgress.taskRuns` (`currentStep`, `completedSteps`, `completedBlockIds`, `reflections`, `actions`, `note`, `reflection`, `sessions`).
- Finalizing the last wizard step does **not** mark the task `done`; it renders `TaskReview` so the user can keep editing actions, notes, and reflection.
- `Step` cards have a content toggle: long `knowledge`/`example`/`hint` text can be collapsed, while the user input/reflection area remains visible.

## DB Schema

Migration `supabase/migrations/20260527000004_framework_method_schema.sql` creates tables prefixed with `fm_` to avoid collisions in the shared Supabase project:

`fm_profiles`, `fm_frameworks`, `fm_templates`, `fm_phases`, `fm_steps`, `fm_blocks`, `fm_user_template`, `fm_user_progress`, `fm_step_responses`, `fm_actions`, `fm_reflections`, `fm_daily_goals`, `fm_sessions`, `fm_streaks`.

## Tasks

`FrameworkProgress` now stores a `tasks` array. Tasks can be created manually in `Overview` or generated automatically when a `Step` is finalized. Each task has `title`, `group` (editable from `Overview`), `category`, `subCategory`, `status` (`todo` | `in_progress` | `done`), `priority`, `date`, and links to `templateId`/`stepId`/`blockId`.

RLS is enabled on all tables. Users see rows where `user_id = auth.uid()`. Published templates (`status = 'published'`) are readable publicly.
