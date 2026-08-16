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
- `/calendar` shows a month/week date picker at the top. Selecting a date reloads that day's tasks/session via `SessionContext.setSessionDate`. Below the calendar are the three color-coded task groups, earn/spend + size controls, and daily Phúc totals.
- `Dashboard` shows today's merit score, streak, and a 7-day Phúc trend chart from `getSessionsByDateRange`.
- New top-level pages `/finance` (Kiểm soát Tài chính) and `/practice` (Luyện thấu triệt) are linked in `SideNav` and `BottomNav`.
- `/practice` includes "Thấu triệt mối quan hệ" with six relationship categories (`eternal`, `close`, `social`, `business`, `friends`, `soul`). Contacts store name, age, address, and notes; data persists via `getRelationships`/`saveRelationships`.
- `/practice` also has a "Thấu triệt" section with four insight types (`person`, `environment`, `work`, `self`), each with its own set of free-text fields; data persists via `getPracticeInsights`/`savePracticeInsights`.
- `/calendar` includes recurring tasks (`RecurringTask`) with `weekly`/`monthly`/`quarterly`/`half_yearly`/`special` recurrence, configurable `warning_before_days`, a preparation note, and a "Chốt làm" button that converts the recurring task into a daily task for the selected `sessionDate`. It also provides one-click `CALENDAR_PRESETS` for common Vietnamese recurring schedules (`Mồng 1 & 15 âm lịch`, `10 ngày ăn chay`, `Lễ giỗ, tế họ`).
- Step 3 (`apply` / `dua_khuon`) templates are block-specific: `Gia đình`, `Công việc`, `Quan hệ`, and `Tài chính` each have their own default checklist items, while `Bản thân` keeps the generic execution-plan items. All templates remain editable in `/builder`.
- `Kiểm soát Tài chính` (`/finance`) now supports income entry with two input modes (`estimate` / `exact`), exact-mode date + installment splitting, and allocation into 5 buckets (`family`, `savings`, `merit_debt`, `reinvest`, `personal`) with per-bucket notes. Data persists via `getFinanceIncome`/`saveFinanceIncome` and `getFinanceExpenses`/`saveFinanceExpenses` in `frameworkMethodService.ts`.
- Step 2 reflection card labels use `session.yourAnalysis` = "Quy chiếu", `session.keyInsights` = "Quy chiếu bên ngoài", and `session.detailedNotes` = "Quy chiếu bên trong".
- Builder item content and section "Ví dụ" content use a new `RichTextEditor` component (`contentEditable` + `document.execCommand`) supporting bold, italic, heading, list, and image URL insertion. `TemplateSectionItem` stores HTML in `content_vi`/`content_en`; `TemplateSection` stores example HTML in `example_content_vi`/`example_content_en`.
- `SessionPage` renders item content and section example content as HTML via `dangerouslySetInnerHTML` so rich text from Builder is preserved in the session.
- `KnowledgeEntry` tracks `is_user_edited` and `seed_version` so `frameworkMethodService.ts` can merge default seed updates into returning users' `localStorage` without overwriting their edits. New seed versions replace un-edited default entries; user-added/edited entries are kept.
- `/calendar` new-task form now has a "Việc định kỳ" checkbox; when checked it exposes recurrence, warning lead time, and preparation-note fields, and the task is saved as a `RecurringTask` instead of an immediate `DailyTask`. The old standalone recurring-task form was removed; recurring tasks are listed in the same section with `Chốt làm` conversion.
- `Template.step_type` is now `string` and `Template` carries `name_vi`/`name_en`/`order_index`; `frameworkMethodService.ts` exposes `DEFAULT_STEP_CONFIG`, `normalizeTemplates`, `getOrderedStepTypes`, and `createCustomTemplate`.
- Builder allows per-block custom step creation (insert after the selected step), reordering (up/down), and deletion (custom steps only). Session `StepIndicator` and `renderStep` derive labels/order from `stepTypes`, so steps 5/6 or inserted steps render with a generic `GenericStep` component; built-in `recognize`/`apply`/`track` keep their specialized UIs regardless of position.
- Nghiệp báo / Trổ canh gamification: `KarmaAccount` (initial 1000 points, `balance`, `daily_offsets`), `KarmaEvent` (monthly/quarterly, reserved 20 points, status `pending`/`recognized`/`resolved`/`triggered`), `KarmaPayment` (prepay or auto-deduct), and `KarmaTemplate` (target + money rows) persist via `frameworkMethodService.ts` with localStorage + Supabase fallback.
- `SessionContext` exposes `karma` (`account`, `events`, `payments`, `nextEvent`, `countdown`, `percent`), `karmaTemplate`, `updateKarmaTemplate`, `performKarmaAction`, and `syncKarma`. It auto-generates `Trổ canh` events, auto-triggers deductions when an event's due date passes, and updates `daily_offsets` whenever positive `merit.total` changes.
- `Dashboard` displays the remaining Nghiệp báo balance with a gradient progress bar and the next Trổ canh countdown, with buttons to open `KarmaActionModal` for `Dừng nghiệp`/`Giải cảnh`.
- `Calendar` shows a `Trổ canh` list with countdowns, status labels, and action buttons; `KarmaActionModal` lets the user `Nhận ra`, `Dừng nghiệp`, or `Giải cảnh` an event, recording a note, image URL, and an editable `Khuôn dừng nghiệp` table. The modal now opens directly on the tab matching the clicked action.
- Merit / Phúc reflection gate: `DailyTask` added `merit_reflected`, `merit_points`, `reflection_outcome`, `reflection_mind`. `calculateMerit` ignores un-reflected tasks; only after the user fills the `MeritReflectionModal` is the point total updated.
- `Calendar` has a dedicated `Sổ Phúc` card listing all merit-marked tasks, and `Trổ canh` is split into `Cảnh hiện tại`, `Cảnh tương lai`, and `Lịch sử cảnh`.
- `Dashboard` hero gamifies Nghiệp vs Phúc side-by-side, showing karma balance vs earned merit with opposing progress bars and quick action buttons including the new `recite` (Đọc Sám) action.
- Dashboard framework list section label (`dashboard.frameworks`) changed to "Đưa khuôn trí tuệ vào cuộc sống" in Vietnamese and "Apply wisdom frameworks to life" in English; related framework label keys use "Khuôn"/"framework" consistently.
- `nav.session` is now "Đưa khuôn trí tuệ vào Sống" / "Apply wisdom to life".
- `History` has been merged into `/calendar`; there is no standalone History page/route. Clicking a date in the calendar opens a day-detail "Nhật ký ngày" panel with applied frameworks (plans/tracks), completed tasks by category, reflected merit, recurring events due, and karma events for that date.
- `KnowledgeEntry` exposes `summary_vi/en` (Cốt ý, shown as the inline snippet in lists and Step 2 items), optional `cot_y_vi/en` (cốt ý sâu), `cot_cua_cot_vi/en` (Cốt của Cốt), and `loi_vi/en` (Lõi / nội dung chi tiết, mirrored to `content_vi`/`content_en` so the session modal and edit form stay in sync). Session modals and the Vault detail view prefer `loi` then `content` for the full body.
- `Template` and `TemplateSection` carry a `seed_version` number. `frameworkMethodService.normalizeTemplates` merges default sections by id: default sections replace any cached built-in section whose `seed_version` is stale, custom user-added sections are preserved, and per-block `apply` sections are rebuilt from `makeApplySection(blockId)`.
- `/calendar` new-task form no longer pre-selects `merit_type` / `merit_size`; merit is evaluated later inside `/session` Step 4 (`Đưa khuôn trí tuệ vào Sống`) via earn/spend toggle, size picker, and `MeritReflectionModal`.
- `/calendar` "Nhật ký" is period-aware (Ngày / Tuần / Tháng / Quý / Năm / Tùy chọn) and replaces the old fixed `Đời/Đạo/Lợi tư` and `Sổ Phúc` lists. It summarizes tasks, applied frameworks, merit totals, recurring events, and karma events for the selected range.
- A global sticky `+` FAB (`GlobalTaskFab`) is rendered in `Layout` on every protected page, opening a quick task-creation modal.
- The `Lễ giỗ, tế họ` calendar preset opens an input modal for custom title, date, warning lead time, and note before creating a `RecurringTask`.
- `Dashboard` hero card title is "Nghiệp - Phúc của bạn trong kiếp này" and the framework-usage card shows real statistics: top completed block, top practiced step (Đưa khuôn / Bám theo dõi), day with most merit earned, and day with most merit spent / Ân oán.
- Default data is seeded from `src/data/knowledgeSeed.ts` and `src/data/templateSeed.ts`. `frameworkMethodService.ts` falls back to these seeds when localStorage and Supabase are empty, so the Knowledge Vault and `/session` Step 2/3/4 templates are pre-populated and remain editable through `/knowledge` and `/builder`.
- `KnowledgeEntry.category` supports `"concept"`, `"framework"`, and `"example"`. Examples (e.g. `vi-du-nau-com`, `vi-du-quet-nha`, `vi-du-xu-ly-email`, `vi-du-hop`, `vi-du-mua-sam`) are shown via a "Ví dụ" button in `/session` Step 2 when the current block has mapped examples.
- `Nghiệp đời` is seeded as `knowledgeSeed` entry `nghiep-doi` and surfaced on the `Dashboard` as the daily nudge: each day do your work to repay life-karma; once repaid, work is no longer required.
- `/session` Step 2 is block-aware: section order and item order inside each section are reordered by `SECTION_ORDER_BY_BLOCK` and `ITEM_PRIORITY_BY_BLOCK` to surface the most relevant principles first for the selected block (`self`, `relationship`, `work`, `finance`, `family`).
- `/session` Step 3 pre-fills the Công thức 5-field plan (`apply-dich`, `apply-thuc-te`, `apply-phuong-phap`, `apply-phoi-hop`, `apply-ke-hoach`) with suggestions derived from Step 2 reference inputs: goal from the task/block, reality from Step 2 notes, method from `phap`/`dao` notes, collaboration from people/resources, and plan from the task title. Saved plans carry the `apply-` prefixed item ids.
- `/session` Step 4 (`track`) renders fields dynamically from the track template's first section items, whose ids now match the `Track` DB columns (`dich`, `thuc_te`, `phuong_phap`, `phoi_hop`, `ke_hoach`). It pre-fills from the saved track or the Step 3 plan when no track exists.
- `Track` type and `SessionContext.saveTrack` support all 5 Công thức fields via a `Record<string, string>` payload.
- `Dashboard` shows a daily nudge card (`dashboard.dailyNudge` / `nudgeLabel` / `nudgeDefault` / `nudgeCta`) that picks a focus block and principle based on the day of the week.
- `/knowledge` filter chips include the `"example"` category; the add form is collapsible and the list is the primary view.
- Seed versions: `KNOWLEDGE_SEED_VERSION` was bumped to 6 and `TEMPLATES_SEED_VERSION` to 3 so existing cached `localStorage` data refreshes with the new `Nghiệp đời`, example entries, and Công thức 5-field templates. The duplicate `vi-du-*` entries in `knowledgeSeed.ts` were removed so the example list renders once per entry.
