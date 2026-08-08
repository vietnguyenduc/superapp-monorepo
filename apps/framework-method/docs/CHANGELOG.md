# Framework Method — Changelog

## 2026-08-04 (Apple HIG + Phúc nghiệp + Finance/Practice pages)

- Refreshed global Apple-inspired design tokens in `index.css` (`--fm-bg`, `--fm-surface`, `--fm-border`, `--fm-primary`, `card`, `btn-primary`, `btn-secondary`, `input`, `section-title`) with system/SF Pro font stack, premium neutral backgrounds (`#F5F5F7` / `#0D0D0F`), frosted glass headers, and `rounded-2xl` surfaces.
- Updated shared components `Card`, `Button`, `Input`, `Layout`, `SideNav`, and `BottomNav` to use the new tokens, active scale, and consistent `font-semibold tracking-tight` headings.
- Polished `SessionPage` `StepIndicator`, `BlockTabs`, `PinnedTasks`, `SectionAccordion`, `SubAccordion`, and `KnowledgeModal` with the new token set and removed all-caps labels.
- Added task category/subcategory mapping (`Đời`, `Đạo`, `Lợi tư`) with color-coded groups and a Phúc nghiệp (merit) ledger.
- Extended `DailyTask` and `Session` types with `category`, `subcategory`, `merit_type`, `merit_size`, `planned_completion_rate`, `merit_earned`, `merit_spent`, and `merit_total`.
- Added `CATEGORY_META`, `MERIT_SIZE_LABELS`, `BLOCK_TO_CATEGORY`, `calculateMerit`, and `plannedCompletionAdjustment` helpers in `frameworkMethodService.ts`.
- Exposed `merit`, `updateTask`, and `setPlannedCompletionRate` from `SessionContext`.
- Redesigned `/calendar` to show a month/week calendar picker at the top, 3 color-coded task groups, merit earn/spend controls, a planned-completion slider, and daily Phúc totals.
- Updated `Dashboard` to show today's merit score, current streak, and a 7-day Phúc trend chart sourced from `getSessionsByDateRange`.
- Added two new top-level pages: `Kiểm soát Tài chính` (`/finance`) with 5 placeholder buckets and `Luyện thấu triệt` (`/practice`) with 4 practice areas plus a relationship-mastery contact list; added routes and navigation entries.
- Added `RelationshipContact` types/categories and localStorage/Supabase-backed CRUD in `frameworkMethodService.ts`; exposed on `/practice` under "Thấu triệt mối quan hệ" with 6 relationship types and name/age/address/notes fields.
- Added `RecurringTask` type and recurrence engine (`weekly`/`monthly`/`quarterly`/`half_yearly`/`special`) with configurable warning-before-days, period-end math, and a note field; surfaced on `/calendar` under "Việc định kỳ" with a one-click "Chốt làm" that converts the recurring task into a daily task for the selected date.
- Added `PracticeInsight` type and localStorage/Supabase-backed CRUD in `frameworkMethodService.ts`; exposed on `/practice` under "Thấu triệt" with four insight types (person, environment, work, self) and per-type fields.
- Added `nav.finance`, `nav.practice`, `calendar.*`, `financeControl.*`, and `practice.*` i18n keys to `vi.json`/`en.json`.
- Validation: `npx tsc -p apps/framework-method/tsconfig.app.json --noEmit` ✅, `npm run lint -w framework-method` ✅, `npm run test -w framework-method` ✅, `npm run build -w framework-method` ✅.

## 2026-08-04

- Polished the Builder and Knowledge UI after Apple HIG review: consistent `rounded-2xl` cards, 44 px touch targets, compact sticky headers, readable dark-mode contrast, and a single-language title/content form in Builder to avoid the Vi/En split.
- Added `image_url` to `KnowledgeEntry` so the Quick View modal and Vault can display diagrams/illustrations; form fields are now Title, Summary, Content, Image URL, Category.
- Added `concept_knowledge_entry_id`, `reference_knowledge_entry_id`, and `example_knowledge_entry_id` to `TemplateSection`, and linked each `recognize` section to three Knowledge entries in Builder.
- Step 2 Concepts/Reference/Examples sub-accordions now render the linked Knowledge entry content instead of empty textareas; the item checklist and reflection input are nested below the knowledge content.
- Step 3 plan fields show each item's `content_vi`/`content_en` and a "Đọc lại dữ liệu" button that opens the linked Knowledge modal.
- Simplified Builder per-section and per-suggestion forms to a single title input that syncs `title_vi`/`title_en`; per-item forms keep title + content textarea + Knowledge link.
- Refreshed the `/knowledge` list to match the mobile mockup: search bar, category chips, icon cards with title/summary/chevron.
- Added `common.add` and renamed `builder.titleVi`/`titleEn` to `builder.sectionTitle`, `builder.suggestionTitle`, `builder.itemTitle` in `vi.json`/`en.json`.
- Added `TemplateSectionItem.content_vi`/`content_en` to the data model and populated item content from Builder.
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
