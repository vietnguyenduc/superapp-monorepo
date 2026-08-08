# Framework Method — Changelog

## 2026-08-04

- Added a sticky "Việc trong ngày" pinned card to Step 3 (Đưa khuôn) and Step 4 (Bám), matching Step 2; it follows the selected block and hides when there are no tasks.
- Wired Builder template edits into `SessionContext`: `updateTemplate` and `saveTemplates` now mutate and persist `templates` (localStorage fallback) so Knowledge links and section/item changes in Builder are reflected in the live session.
- Added `getAllTemplates`/`saveAllTemplates`/`buildDefaultTemplates` in `frameworkMethodService.ts` so all blocks and steps share one template store.
- Removed `Overview`, `Actions`, and `Evening` routes, navigation entries, and page files; merged their purpose into `History`, which now lists tasks grouped by block with plan/track status badges.
- Updated `History` to use `useSession` (`tasks`, `applyPlans`, `tracks`) and `history.*` i18n keys.
- Renamed `session.backToOverview` to `session.backToDashboard` and pointed the session back button to `/dashboard`.

## 2026-08-04

- Added "Dữ liệu Trí tuệ" (Knowledge Vault) page at `/knowledge` with search, category filter chips (Tất cả / Khái niệm / Khuôn mẫu), and CRUD for knowledge entries.
- Added `KnowledgeEntry` type with `title`, `summary`, `content`, `category` (concept/framework), and `order_index`.
- Added `getKnowledgeEntries`/`saveKnowledgeEntries` in `frameworkMethodService.ts` with `localStorage` fallback and `fm_knowledge` Supabase upsert.
- Exposed `knowledgeEntries`, `addKnowledgeEntry`, `updateKnowledgeEntry`, `removeKnowledgeEntry` from `SessionContext`.
- Builder now lets authors link each `TemplateSectionItem` to a Knowledge entry via a dropdown (`knowledge_entry_id`).
- Added `KnowledgeModal` Quick View pop-up in `SessionPage` Step 2 (Concepts) and Step 3 (Plan fields), so end users can read linked knowledge without leaving the session.
- Added `knowledge.*` and `session.readKnowledge` i18n keys in Vietnamese and English.
- Added `/knowledge` route and navigation entries in `SideNav` and `BottomNav`.

## 2026-08-04

- Rewrote Step 1 "Bạn có biết?" insight card as a natural-language sentence with dynamic counts (`total_done`, `total_applied + total_tracked`, `pending_carryover`) instead of a 3-column number grid.
- Added `session.insight.*` i18n keys in Vietnamese and English to support zero/one/many word forms.
- Builder now exposes a "Gợi ý việc" section per block so end users can add, edit, reorder, and delete task suggestions as free text; suggestions persist in `localStorage` and are wired into Step 1.
- Added `getAllTaskSuggestions`/`saveTaskSuggestions` in `frameworkMethodService.ts` with localStorage fallback while `fm_task_suggestions` is unavailable.
- Step 2 "Việc trong ngày" pinned card is now sticky on scroll, filters by the currently selected block, and hides when the selected block has no tasks.
- Updated `apps/framework-method/src/types/index.ts` to add `order_index` to `TaskSuggestion`.
- Verified in browser: Builder edits reflect immediately in `/session` suggestions; Step 2 sticky card follows block selection and disappears for blocks without tasks.

## 2026-08-09

- Added trial-mode button `Dùng thử không cần tài khoản` to `Login.tsx`.
- `ProtectedRoute` now uses `isAuthenticated` from `@superapp/iam` instead of requiring a Supabase `session`, so trial users can access `/dashboard`, `/session`, `/builder`, etc.
- Added `login.*` i18n keys for Vietnamese and English.
- Added `SideNav` and updated `Layout` so the app has a persistent left sidebar on desktop and a hamburger drawer on mobile.
- Updated `BottomNav` to include `Builder` and use `nav.dashboard`/`nav.builder` labels.
- Added `nav.dashboard`, `nav.evening`, `nav.menu`, `nav.builder`, and `common.close` i18n keys.
- Verified in browser: trial login reaches Dashboard with visible sidebar; all routes (Dashboard, Overview, Session, Actions, Evening, Calendar, History, Builder) and Builder page are reachable.

## 2026-08-08

- Set `i18n` default language to Vietnamese (`lng: "vi"`, `fallbackLng: "vi"`) and added missing `common.back` key in `vi.json`/`en.json`.
- Fixed `SessionContext` hook ordering so `persistSession`/`setCurrentBlockIndex` are declared before `loadData`, eliminating the `Cannot access 'Te' before initialization` runtime error.
- Verified the 4-step flow in the browser: `/session` renders Step 1 (Lên việc), Step 2 (Nhận ra), Step 3 (Đưa khuôn), and Step 4 (Bám) with per-task apply/track and Vietnamese labels.
- Refactored `apps/framework-method` to implement the PRD 4-step flow (Khối → Nhận ra → Đưa khuôn → Bám).
- Wired `SessionProvider` in `App.tsx`; replaced `/step/:stepId` with `/session` route (`SessionPage`).
- Updated `Dashboard`, `Overview`, and `BottomNav` to link to `/session`.
- Rewrote `Builder` to edit `Template`/`TemplateSection`/`TemplateSectionItem` per block and per step, with add/remove/reorder sections and items.
- Added `session.*` and `builder.*` i18n keys for Vietnamese and English.
- Fixed `SessionContext` streak-null type error and `SessionPage` unused-variable / `TaskSource` type issues.
- Cast `frameworkMethodService.ts` to a runtime-typed `db` wrapper so queries to `fm_*` tables compile while `@repo/types` `Database` is not regenerated.
- Exported `DEFAULT_BLOCKS` and `DEFAULT_TEMPLATES` from `frameworkMethodService.ts` so `Builder` and the service share the same fallback data.
- Removed temporary `src/test-fm.ts`.
- Cleaned up `packages/shared-utils` unused imports that broke strict `tsc` for dependent apps.
- Validation: `npx tsc -p apps/framework-method/tsconfig.app.json --noEmit` ✅, `npm run test -w framework-method` ✅, `npm run build -w framework-method` ✅.

## 2026-08-07

- Added `PRD-framework-method.md` locking the 4-step flow (Khối → Nhận ra → Đưa khuôn → Bám) and 6 product decisions.
- Documented `fm_*` data model: `fm_blocks` as 5 life domains, `fm_daily_tasks` with carry-over, `fm_block_stats` for all-time insight, `fm_templates`/`fm_template_sections` for Builder, `fm_sessions` for drafts/non-linear flow, `fm_apply_plans`/`fm_track` per-task.
- Noted existing `fm_blocks` (template content) will be renamed/merged to avoid collision with the new life-domain `fm_blocks`.
- Updated `AI-CONTEXT.md` to point to the PRD as the source of truth for flow decisions.

## 2026-08-06

- Initial app scaffold with 9 screens (Dashboard, Overview, Step, Actions, Evening, Calendar, History, Builder).
- Pixel-level redesign to match provided design screenshots.
- Shared auth integration with `@superapp/iam` and shared Supabase client.
- Theme provider with dark/light mode.
- Tailwind design system: Inter font, blue primary, violet accent, rounded-2xl cards.
- Supabase migration for `fm_*` tables with RLS and published-template read policy.
- Registered app in `AppSwitcher` components, `packages/shared-utils/src/app-urls.ts`, and `apps/superapp-business-bot/config/settings.json`.
- Vercel config and README added.
