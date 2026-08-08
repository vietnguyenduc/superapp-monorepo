# Framework Method — AI Context

## Architecture

- `apps/framework-method/src/main.tsx` wraps `<App />` with `<AuthProvider>` from `@superapp/iam` and a local `ThemeProvider`.
- `src/services/supabase.ts` uses `createSupabaseClient` from `@superapp/shared-utils` and the shared Supabase project (`peslmsctejmvkwzyohke.supabase.co`).
- Auth is email/password only; SSO cross-app works via `detectSessionInUrl` and `AppSwitcher` links with `access_token`/`refresh_token`.
- Routes are protected by `ProtectedRoute`; unauthenticated users land on `/login`.
- Trial mode: `Login.tsx` has a `Dùng thử không cần tài khoản` button. It calls `startTrial()` from `@superapp/iam` and navigates to `/dashboard`. `ProtectedRoute` now checks `isAuthenticated` (which is `true` for trial users) instead of only `session`, so trial users can access protected routes.
- Navigation: `Layout` renders a persistent left sidebar on desktop (`SideNav`) and a hamburger top header on mobile. `BottomNav` provides quick tabs on mobile and now includes `Thiết kế` (Builder). All routes (Dashboard, Overview, Session, Actions, Evening, Calendar, History, Builder) are reachable from the sidebar.

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

- `SessionProvider` is mounted in `App.tsx` around the protected `<Layout />`. It now also owns per-block `taskSuggestions` loaded from `frameworkMethodService.getAllTaskSuggestions()` and exposes `updateTaskSuggestions(blockId, suggestions)` for `Builder` mutations.
- `/session` route renders `SessionPage` (4 steps: Lên việc / Nhận ra / Đưa khuôn / Bám). Old `/step/:stepId` route has been removed.
- `Dashboard` and `Overview` "Bắt đầu phiên" / "Start Session" buttons navigate to `/session`.
- `BottomNav` steps icon now links to `/session`.
- `Builder` edits `TemplateSection` + `TemplateSectionItem` per block and per step, and also exposes a "Gợi ý việc" free-text editor that lets end users add/edit/reorder/delete per-block task suggestions. It initializes from `DEFAULT_BLOCKS` and `DEFAULT_TEMPLATES` in `frameworkMethodService` so the UI is usable even if Supabase `fm_*` tables are not present yet.
- Step 1 "Bạn có biết?" card is rendered as a natural-language sentence using `total_done`, `total_applied + total_tracked`, and `pending_carryover` from `blockStats`.
- Step 2 "Việc trong ngày" pinned card is `sticky` on scroll, filters by the active block, and is hidden when the active block has no tasks.
- `i18n/locales/vi.json` and `en.json` contain `session.*`, `session.insight.*`, and `builder.*` keys for the new flow.
- `frameworkMethodService.ts` supplies `getAllTaskSuggestions`/`saveTaskSuggestions` with `localStorage` fallback and default suggestion lists. It still logs errors to `console.warn` in fallback paths and supplies default blocks and templates when DB queries fail.
- `SessionContext` hook order: `persistSession` and `setCurrentBlockIndex` are declared before `loadData` so `loadData` can safely reference them without a TDZ/`Cannot access before initialization` runtime error.
- `i18n` is initialized with `lng: "vi"` and `fallbackLng: "vi"` so the app defaults to Vietnamese. `common.back` was added to both locale files.
- A "Dữ liệu Trí tuệ" (Knowledge Vault) page lives at `/knowledge`. It stores `KnowledgeEntry` records (title, summary, content, category concept/framework) with search + category filters and CRUD. `SessionContext` exposes `knowledgeEntries` and mutation helpers backed by `frameworkMethodService.getKnowledgeEntries`/`saveKnowledgeEntries` (`localStorage` fallback to `fm_knowledge`).
- Builder lets authors attach a `knowledge_entry_id` to any `TemplateSectionItem`. In `/session` Step 2 (Concepts) and Step 3 (Plan fields), items with a linked entry render a "Đọc lại dữ liệu" / "Read knowledge" button that opens a Quick View modal (`KnowledgeModal`) without leaving the session. The modal has a "Xem đầy đủ trong Vault" button that navigates to `/knowledge`.
- `nav.knowledge`, `knowledge.*`, and `session.readKnowledge` i18n keys were added to `vi.json` and `en.json`.
- Builder template edits are wired into `SessionContext` via `updateTemplate`/`saveTemplates` and persisted through `frameworkMethodService.saveAllTemplates` (`localStorage` fallback), so changes made in Builder are reflected immediately in `/session`.
- The sticky "Việc trong ngày" pinned card is present in Step 2, Step 3, and Step 4, filtered by the active block.
- `Overview`, `Actions`, and `Evening` pages/routes were removed; their logged-task purpose is merged into `History`, which displays tasks grouped by block with plan/track badges.
- `packages/shared-utils` unused imports (`exportToFile`, `templateData`, `SupabaseClient`, `Database`) were removed so that `tsc -p apps/framework-method/tsconfig.app.json --noEmit` does not fail on cross-package `noUnusedLocals`.
- `TemplateSection` now carries `concept_knowledge_entry_id`, `reference_knowledge_entry_id`, `example_knowledge_entry_id` so Step 2 Concepts/Reference/Examples can render knowledge content linked in Builder.
- `TemplateSectionItem` now carries `content_vi`/`content_en` so Step 3 plan fields and Step 2 item panels can show a brief knowledge snippet inline.
- `KnowledgeEntry` now carries `image_url` and the CRUD form is Title + Summary + Content + Image URL + Category; `vi.json`/`en.json` use `knowledge.*` keys.
- Builder per-section and per-suggestion forms use a single title input that mirrors to `title_vi`/`title_en`; per-item forms keep a title, a content textarea, and a Knowledge link dropdown.
- The `/knowledge` list follows the mobile mockup: search, filter chips, icon + title + summary + chevron cards.
- `SessionPage` Step 2 renders the linked knowledge content inside each Concepts/Reference/Examples sub-accordion, then shows the item checklists and reflection inputs. Items with a linked entry or with inline content show a "Đọc lại dữ liệu" button that opens `KnowledgeModal`.
- `SessionPage` Step 3 shows each plan field with the item title/content and a Knowledge read button; `draft` state keeps edits per selected task before saving.
- Global Apple-inspired theme refresh in `index.css` (`--fm-bg` `#F5F5F7`, `--fm-bg-dark` `#0D0D0F`, `--fm-surface`, `--fm-border`, `card`, `btn-primary`, `btn-secondary`, `input`, `section-title`) is used by `Card`, `Button`, `Input`, `Layout`, `SideNav`, and `BottomNav`.
- Tasks now carry `category`/`subcategory` mapped to three groups (`Đời`, `Đạo`, `Lợi tư`) and a Phúc nghiệp ledger with `merit_type`/`merit_size` (`small`/`medium`/`big`/`very_big` = 1/2/3/4 points). `Session` stores `planned_completion_rate` and `merit_earned`/`merit_spent`/`merit_total`.
- `calculateMerit` and `plannedCompletionAdjustment` helpers in `frameworkMethodService.ts` implement the user's scoring rules: no logged merit tasks = 0 total; completion rate <60% = -2, 60-79% = -1, 80-99% = +1, 100% = +2.
- `/calendar` groups tasks by the three color-coded groups, lets users set earn/spend + size per task, and shows daily Phúc totals.
- `Dashboard` shows today's merit score, streak, and a 7-day Phúc trend chart from `getSessionsByDateRange`.
- New top-level pages `/finance` (Kiểm soát Tài chính) and `/practice` (Luyện thấu triệt) are linked in `SideNav` and `BottomNav`; they are currently shells with placeholder buckets/areas awaiting detailed labels.
