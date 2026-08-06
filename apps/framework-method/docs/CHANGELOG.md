# Framework Method — Changelog

## 2026-08-06

- Initial app scaffold with 9 screens (Dashboard, Overview, Step, Actions, Evening, Calendar, History, Builder).
- Pixel-level redesign to match provided design screenshots.
- Shared auth integration with `@superapp/iam` and shared Supabase client.
- Theme provider with dark/light mode.
- Tailwind design system: Inter font, blue primary, violet accent, rounded-2xl cards.
- Supabase migration for `fm_*` tables with RLS and published-template read policy.
- Registered app in `AppSwitcher` components, `packages/shared-utils/src/app-urls.ts`, and `apps/superapp-business-bot/config/settings.json`.
- Vercel config and README added.

## 2026-08-06 (hotfix)

- Added top Navigation header and wired logo to Dashboard.
- Fixed `ProtectedRoute` to allow authenticated or trial users.
- Wired Overview "Back to home", "Start Session", and "View All" actions.
- Added `useFrameworkProgress` hook with `localStorage` persistence for current step, completed steps, and reflections.
- Step page now loads/saves reflections, enables "Complete Step" only when all sections are filled, and advances to the next step.
