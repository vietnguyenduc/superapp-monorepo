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

## 2026-08-06 (redesign + persist pass)

- Added `MobileHeader` for mobile: sun icon, centered date, smiley/avatar; step route shows "Back" + step count; builder route hidden from shared layout.
- Updated `Layout` to render `MobileHeader`/`BottomNav` only on mobile and `Navigation` on desktop; builder gets full-width container.
- Redesigned/persisted `Actions`: editable committed action list, midday reflection, quick notes (all saved to `useFrameworkProgress`).
- Redesigned/persisted `Evening`: "What went well", tomorrow focus items (add/toggle/remove), notes, and "Close the Day" that saves a daily session to history.
- Redesigned/persisted `History`: reads completed `sessions` from `useFrameworkProgress`, empty state, sorted by date.
- Wired `Builder` to `useFrameworkProgress`: blocks auto-saved to the active template; Publish prompts for name and persists a new or updated template; active template becomes the current framework.
- Added `FrameworkOverlay`: shows phases, switch templates, framework overview; default templates include Deep Work / Time Blocking.
- Updated `Dashboard` to use progress-derived active framework progress and framework list from saved templates.
- Removed duplicate per-page headers from `Dashboard` and `Calendar`; shared `MobileHeader` now covers them.
- Added missing i18n keys for evening goals and builder published state.
- Mobile responsiveness verified on 400px device emulation; bottom nav and mobile header render correctly.

## 2026-08-06 (builder templates)

- Builder now has a template selector: choose an existing template to edit, or create a new one.
- Template name is editable inline in the header.
- Publish saves the current template (new or existing) and switches it to active.
- Auto-save indicator shows "Auto-saved" / "Published" status.
