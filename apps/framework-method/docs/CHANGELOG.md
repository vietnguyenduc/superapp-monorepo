# Framework Method — Changelog

## 2026-08-07 (daily mix + cross-template references)

- Added `Daily Mix` section in `Builder`: choose one or more templates and `setDailyTemplates` to combine them into a single daily framework.
- Added `referenceBlockId` to `Block` type; Builder has a dropdown to select a previous block whose answer is displayed inside the current block.
- Added `showIfBlockId` / `showIfValue` to `Block`; Step page filters visible blocks based on whether another answer contains the expected value (Tally-style conditional fields).
- Step page resolves `{{answer:blockId}}` placeholders in prompts, placeholders, reflection questions, and hints so answers can flow between templates.
- Added i18n keys for reference/dependency (`builder.referenceBlock`, `builder.dependsOn`, `step.referencedAnswer`, `step.referenceMissing`).
- Calendar month view uses larger colored dots, a primary border for selected days, and `date-fns/locale/vi` for Vietnamese date titles.

## 2026-08-07 (repo hygiene)

- Added root `.devinignore` to keep Devin from indexing node_modules, dist, build artifacts, lockfiles, media, backups, and environment files.
- Updated repo environment blueprint with `framework-method-build` and `devinignore` knowledge entries.

## 2026-08-07 (desktop navigation)

- Added a persistent horizontal navigation menu to `Navigation.tsx` for desktop/tablet (`md+`) with links to Overview, Steps, Actions, History, and Builder.
- Kept the mobile `BottomNav` unchanged; desktop users no longer see an empty header.

## 2026-08-06 (progress persistence fix)

- Replaced module-level `useSyncExternalStore` singleton in `useFrameworkProgress` with a `ProgressProvider` React Context to ensure all components read/write the same in-memory state.
- All progress mutations (`saveReflection`, `completeStep`, `closeDay`, `saveTemplate`, etc.) now save to `localStorage` synchronously inside the state updater.
- Debounced reflection saving in `Step` (600 ms) and forced immediate save before `completeStep` to avoid rapid `localStorage` writes.
- Confirmed in SPA navigation: after completing the final step, `History` now shows the logged "Daily Framework" session immediately.
- `App.tsx` wraps the app with `ProgressProvider` so the store is stable across route changes.

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

## 2026-08-06 (mobile UX)

- Added `Builder` to `BottomNav` so mobile users can open the builder.
- Replaced mobile header sun icon with a Home icon linking to `/dashboard`.
- Removed unused builder branch from `MobileHeader` (builder renders its own responsive header).
- Made `Builder` responsive: template selector and block catalog visible on mobile, header buttons collapse to icon-only, template name input adapts to width.
- `BottomNav` now also shows on the builder route so mobile users can switch screens without leaving the app.

## 2026-08-06 (calendar views)

- Replaced placeholder `Calendar` with full Day / Week / Month / Quarter views.
- Three activity groups: Framework (sessions), Actions (committed actions), Reflections (midday, quick notes, evening).
- Month view shows colored dots per group for each day; clicking a day updates the detail panel.
- Week view displays 7 day columns with grouped event cards.
- Quarter view shows 3 mini month grids with days that have activity highlighted.
- Added `createdAt` to `ActionItem` so actions appear on the calendar on the correct date.
- Added i18n keys for `day`, `quarter`, `today`, `scheduledFor`, `noEvents`, `noEventsGroup`, and group labels.
