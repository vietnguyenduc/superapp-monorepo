# Framework Method — Changelog

## 2026-08-15 (Session Step 2 section order fix)

- Aligned `SECTION_ORDER_BY_BLOCK` in `src/pages/Session/SessionPage.tsx` so all blocks show the Step 2 recognize sections as Nguyên lý → Đạo → Pháp, matching the Builder/template order.
- Validation: `npm run type-check -w framework-method` ✅, `npm run test -w framework-method` ✅, `npm run build -w framework-method` ✅.

## 2026-08-15 (Knowledge Vault UI polish)

- Added `isLoading` check in `src/pages/Knowledge/Knowledge.tsx` so the "Chưa có dữ liệu nào" message is not shown while `SessionContext` is still fetching `knowledgeEntries`.
- Added a non-breaking space between the entry count and `knowledge.entries` label in group headers.
- Updated `knowledge.cotY` i18n labels to "Cốt ý đầy đủ" (vi) and "Detailed core idea" (en) and skipped the `cot_y` detail block when it is identical to `summary`.
- Validation: `npm run type-check -w framework-method` ✅, `npm run test -w framework-method` ✅, `npm run build -w framework-method` ✅.

## 2026-08-15 (Knowledge Vault accordion + data cleanup + seed v8)

- Added `group_vi` and `group_en` to `KnowledgeEntry` in `src/types/index.ts` and assigned every default entry to a Sách Vàng table-of-contents group (`A. Mở đầu` → `R. Ví dụ`) via `scripts/fix_knowledge_seed.py` and `scripts/patch_short_entries.py`.
- Reorganized `src/pages/Knowledge/Knowledge.tsx` to render collapsible group accordions; group headers show the group title and entry count, clicking expands the group, clicking an entry expands its detail inline (`Cốt ý`, `Cốt của Cốt`, `Lõi`) without a modal. The old `viewing` modal and `Xem lại dữ liệu` flow were removed from this page.
- Normalized all list-valued `summary/cot_y/cot_cua_cot/loi/content` fields in `src/data/knowledgeSeed.ts` to strings and backfilled short `loi_vi`/`content_vi` for `dao-4`, `dao-5`, `dao-6`, `goc-tri-tue`, `goc-do-cua-tri-tue`, `biet-goc-va-bam-goc`, `nguyen-tac-chuan-muc`, `luyen`, `6-gia-tri-mang-lai`, `tri-tue-de-lam-gi`, `phuong-phap-chia-se-tri-tue-cho-cac-con`, `phuong-phap-ung-dung-trien-khai-cu-the` directly from the Sách Vàng OCR, preserving original wording.
- Cleaned corrupted `cot_cua_cot` entries that had been stored as Python-dict/list string literals (`tri-tue-la-thuc-te-khoa-hoc-tam-linh`, `nghia`, `tri-tue-de-lam-gi`).
- Added `knowledge.cotY`, `knowledge.entries`, and `knowledge.ungrouped` i18n keys to `src/i18n/locales/vi.json` and `en.json`.
- Bumped `KNOWLEDGE_SEED_VERSION` to 8 in `src/services/frameworkMethodService.ts` so returning users receive the re-grouped, cleaned, expanded seed without clearing `localStorage`.
- Validation: `npm run type-check -w framework-method` ✅, `npm run test -w framework-method` ✅, `npm run build -w framework-method` ✅.

## 2026-08-15 (Expand Knowledge Vault from Sách Vàng OCR)

- Extracted and added the remaining sections of the Sách Vàng OCR (`/home/ubuntu/ocr_pages/pdf_full.txt`) to `src/data/knowledgeSeed.ts`, growing the seed from 43 to 135 `KnowledgeEntry` records.
- New entries cover `PHẦN 2: Quy luật` (6 sub-laws: Tạo Hóa, Trời Phật, Thời thế, Con người, Vạn vật, Thời gian), `PHẦN 3: Hiếu - Lễ - Nghĩa`, `PHẦN 4: Biết gốc & Bám gốc`, `PHẦN 5: Nguyên tắc`, `PHẦN 6: Ý pháp mở rộng & Tâm từ bi`, `PHẦN 7: Xoay chuyển`, `PHẦN 8: Hành`, `PHẦN 9: Luyện & Sửa`, `PHẦN 10: Tu`, `PHẦN 11: Kế thừa`, plus the intro/outro concepts (`Góc độ`, `Quy chuẩn`, `Định nghĩa`, `Giá trị`, `Trí tuệ là khuôn vàng thước ngọc`, `Trí tuệ là thực tế khoa học tâm linh`, `Định hướng 10 điều`, `Phân biệt tri tuệ/khác kiến thức/trí thức`, `6 giá trị`, `Trí tuệ để làm gì`, `Phương pháp ứng dụng triển khai cụ thể`).
- Ran an enrichment pass on the shortest generated entries (under 120 chars) so `loi_vi`/`content_vi` and derived English fields now hold full sentences instead of placeholder fragments.
- Bumped `KNOWLEDGE_SEED_VERSION` to 7 in `frameworkMethodService.ts` so existing cached `localStorage` users automatically receive the expanded library without clearing storage.
- Validation: `npm run type-check -w framework-method` ✅, `npm run test -w framework-method` ✅, `npm run build -w framework-method` ✅.

## 2026-08-15 (Nghiệp đời, examples, block-aware session UX, and Công thức 5-field templates)

- Added `nghiep-doi` to `src/data/knowledgeSeed.ts`: a `KnowledgeEntry` explaining that each day one must work to repay life-karma; when it is repaid, work is no longer required. It is mirrored to `content_vi`/`loi_vi` and surfaced on the `Dashboard` via the new daily nudge card.
- Added `KnowledgeEntry.category = "example"` support in `src/types/index.ts`, plus 5 example entries (`vi-du-nau-com`, `vi-du-quet-nha`, `vi-du-xu-ly-email`, `vi-du-hop`, `vi-du-mua-sam`) with detailed step-by-step quy chiếu.
- Updated `src/data/templateSeed.ts` so the Step 3 `apply` template and the Step 4 `track` template both use the 5-field Công thức đối cảnh (`apply-dich`/`dich`, `apply-thuc-te`/`thuc_te`, `apply-phuong-phap`/`phuong_phap`, `apply-phoi-hop`/`phoi_hop`, `apply-ke-hoach`/`ke_hoach`).
- Updated `src/types/index.ts` `Track` interface and `src/contexts/SessionContext.tsx` `saveTrack` to accept a `Record<string, string>` and persist all 5 Công thức fields.
- Made `/session` Step 2 block-aware in `src/pages/Session/SessionPage.tsx`: sections and items are reordered per `SECTION_ORDER_BY_BLOCK` and `ITEM_PRIORITY_BY_BLOCK` for `self`, `relationship`, `work`, `finance`, and `family`.
- Added a "Ví dụ" toggle in Step 2 that lists example entries per block (e.g. `vi-du-nau-com`/`vi-du-quet-nha` for `family`, `vi-du-xu-ly-email`/`vi-du-hop` for `work`, `vi-du-mua-sam` for `finance`).
- Prefilled Step 3 "Đưa khuôn" with suggestions derived from Step 2 reference inputs: Đích from task/block, Thực tế from notes, Phương pháp from `phap`/`dao` notes, Phối hợp from people/resources, and Kế hoạch from the task title.
- Made Step 4 "Bám" dynamic: it renders fields keyed by track template item ids and pre-fills from the saved track or the Step 3 plan.
- Added a daily nudge card to `src/pages/Dashboard/Dashboard.tsx` with `DAILY_FOCI` mapping day-of-week to a focus block/principle and a fallback `Nghiệp đời` message.
- Reordered `src/pages/Knowledge/Knowledge.tsx` to make the library list primary and the add form collapsible, and added the `"example"` filter chip and category option.
- Added i18n keys in `src/i18n/locales/vi.json` and `en.json` for `dailyNudge`, `nudgeLabel`, `nudgeDefault`, `nudgeCta`, `viewExample`, `hideExample`, `applySuggestion`, and `noStep2Input`.
- Updated `frameworkMethodService.ts` so `saveTrack` returns the track object even if the Supabase `fm_track` insert fails, avoiding UI breakage while the DB schema may lack the new columns.
- Bumped `KNOWLEDGE_SEED_VERSION` to 6 and `TEMPLATES_SEED_VERSION` to 3 in `frameworkMethodService.ts` so cached `localStorage` data refreshes with the new `Nghiệp đời` entry, examples, and 5-field templates.
- Validation: `npm run type-check -w framework-method` ✅, `npm run test -w framework-method` ✅, `npm run build -w framework-method` ✅.

## 2026-08-15 (Duplicate examples cleanup)

- Removed duplicate `vi-du-*` example entries from `src/data/knowledgeSeed.ts`; the array now contains a single set of example entries (`vi-du-nau-com`, `vi-du-quet-nha`, `vi-du-xu-ly-email`, `vi-du-hop`, `vi-du-mua-sam`) aligned with the Công thức đối cảnh 5-field template.
- Bumped `KNOWLEDGE_SEED_VERSION` to 6 in `frameworkMethodService.ts` so returning users with cached `fm_knowledge_v1` refresh to the deduplicated seed.
- Validation: `npm run type-check -w framework-method` ✅, `npm run test -w framework-method` ✅, `npm run build -w framework-method` ✅.

## 2026-08-15 (Knowledge button label)

- Simplified the knowledge detail button label in `src/i18n/locales/vi.json` and `src/i18n/locales/en.json` from "Xem đầy đủ trong Dữ liệu Trí tuệ" / "View full in Knowledge Library" to "Xem lại dữ liệu" / "Review data" for clarity.

## 2026-08-15 (Template seed versioning + richer snippets)

- Added `seed_version` to `Template` and `TemplateSection` types and to `frameworkMethodService.buildDefaultTemplates`/`normalizeTemplates`. Returning users with stale `fm_templates_v3` caches automatically receive corrected built-in Step 2/3/4 sections; custom user-added sections are preserved.
- `normalizeTemplates` now rebuilds per-block `apply` sections via `makeApplySection(blockId)` and merges default sections by id + `seed_version`, fixing an issue where `apply` templates could default to the `self` block layout.
- `SessionPage.SectionItemInput` now prefers `summary_vi/en` (Cốt ý) for the inline snippet under each checklist item, falling back to `cot_y` then `content`.
- `Knowledge.tsx` card subtitle and detail view now prefer `summary` for the Cốt ý display; the list snippet uses `line-clamp-3`.
- `SessionPage.KnowledgeModal` and `Knowledge.tsx` detail view prefer `loi` then `content` for the full body.
- Validation: `npm run type-check -w framework-method` ✅, `npm run test -w framework-method` ✅, `npm run build -w framework-method` ✅.

## 2026-08-15 (Knowledge Vault detail modal)

- Added a read-only detail modal to `src/pages/Knowledge/Knowledge.tsx`: clicking any knowledge card now opens a modal showing `Cốt ý`, `Cốt của Cốt`, and `Lõi` (with image preview if available).
- Edit and delete buttons on cards now stop event propagation so the detail modal doesn't open when using those actions.
- Validation: `npm run type-check -w framework-method` ✅, `npm run test -w framework-method` ✅, `npm run build -w framework-method` ✅.

## 2026-08-15 (Session Step 2 cleanup & inline knowledge snippets)

- Removed `Nguyên lý trí tuệ` and `Nguyên lý sống` checklist items from Step 2 “Nhận ra” in `src/data/templateSeed.ts`; the first section now focuses on the 8 `NLCĐ` entries and is renamed to `Nguyên lý Cuộc đời`.
- Bumped template `localStorage` key from `fm_templates_v2` to `fm_templates_v3` in `frameworkMethodService.ts` so returning users receive the updated default Step 2 template without a manual cache clear.
- Updated `SectionItemInput` in `src/pages/Session/SessionPage.tsx` to display a short knowledge snippet (`cot_y` → `summary` → `content`) under each item title when the item has no inline `content_vi`; the full entry is still available via the `Đọc lại dữ liệu` / `Read knowledge` modal.
- Validation: `npm run type-check -w framework-method` ✅, `npm run test -w framework-method` ✅, `npm run build -w framework-method` ✅.

## 2026-08-15 (Knowledge Vault Dao overview enrichment)

- Replaced placeholder `summary_vi`/`content_vi`/`cot_y_vi`/`cot_cua_cot_vi`/`loi_vi` in `src/data/knowledgeSeed.ts` for `dao-overview` with a structured summary derived from the seven `dao-1..7` detail entries.
- Bumped `KNOWLEDGE_SEED_VERSION` to 4 in `frameworkMethodService.ts` so returning users' cached `localStorage` entries are re-merged with the enriched Dao overview on next load.

## 2026-08-15 (Knowledge Vault overview content enrichment)

- Replaced placeholder `summary_vi`/`content_vi`/`cot_y_vi`/`cot_cua_cot_vi`/`loi_vi` in `src/data/knowledgeSeed.ts` for `nlcd-overview` and `yphap-overview` with structured summaries derived from their detail entries.
- Bumped `KNOWLEDGE_SEED_VERSION` to 3 in `frameworkMethodService.ts` so returning users' cached `localStorage` entries are re-merged with the enriched overviews on next load.

## 2026-08-15 (Knowledge Vault seed propagation fix)

- Added `is_user_edited` and `seed_version` to `KnowledgeEntry` type.
- `frameworkMethodService.getKnowledgeEntries` now stores a `KNOWLEDGE_SEED_VERSION` in `localStorage` and merges cached entries with `defaultKnowledgeEntries` whenever the seed version changes.
- Un-edited default entries are replaced by the latest seed; user-added or edited entries are preserved.
- `SessionContext` marks new/updated Knowledge entries as `is_user_edited: true`; `saveKnowledgeEntries` strips `is_user_edited`/`seed_version` before Supabase upsert to avoid schema mismatch.
- Validation: `npm run type-check -w framework-method` ✅, `npm run test -w framework-method` ✅, `npm run build -w framework-method` ✅.

## 2026-08-15 (Enriched Knowledge Vault seed content)

- Re-enriched `src/data/knowledgeSeed.ts` from the 180-page scanned PDF OCR (`/home/ubuntu/ocr_pages/pdf_full.txt`) so that `cot_cua_cot_vi` (list subtitle), `summary_vi` (Cốt ý), `loi_vi`/`content_vi` (Lõi / chi tiết) no longer repeat titles.
- All 43 `KnowledgeEntry` seeds now have document-derived `content_vi` with structured bullets and cleaned OCR noise.
- Added `scripts/enrich_knowledge.py` helper to regenerate/refresh seed content from the OCR dump using the DeepSeek API.
- Validation: `npm run type-check -w framework-method` ✅, `npm run test -w framework-method` ✅, `npm run build -w framework-method` ✅.

## 2026-08-15 (Seeded Knowledge Vault & session flow defaults)

- Added `src/data/knowledgeSeed.ts` with 43 `KnowledgeEntry` records (5 Nguyên lý Trí tuệ, 3 Nguyên lý Sống, 8 Nguyên lý Cuộc đời, 7 Đạo, 15 Ý pháp, Công thức đối cảnh/giải cảnh, and 4 overview entries) in Vietnamese.
- Added `src/data/templateSeed.ts` exporting `defaultRecognizeSections`, `defaultApplySection(blockId)`, and `defaultTrackSection` with stable IDs and linked `knowledge_entry_id`/`concept_knowledge_entry_id`/`reference_knowledge_entry_id` values.
- Updated `src/services/frameworkMethodService.ts` to fall back to `defaultKnowledgeEntries` and default templates when localStorage/Supabase is empty, so `/knowledge` and `/session` Step 2/3/4 are pre-populated on first use.
- Linked Step 2 "Nhận ra" Nguyên lý / Đạo / Pháp sections to overview and detail Knowledge entries; linked Step 3 "Đưa khuôn" block-specific plan items and Step 4 "Bám" tracking items to relevant concepts.
- Data remains editable via the `/knowledge` Vault and `/builder` pages after seed.
- Validation: `npm run lint -w framework-method` ✅, `npm run type-check -w framework-method` ✅, `npm run test -w framework-method` ✅, `npm run build -w framework-method` ✅.
- Verified locally in browser: `/knowledge` lists all 43 seed entries and `/session` Step 2 renders the seeded Nguyên lý, Đạo, and Pháp sections with "Đọc lại dữ liệu" links.

## 2026-08-04 (Calendar + Session + Dashboard refinement)

- Fixed typo `Trổ canh` → `Trổ cảnh` across `Calendar.tsx`, `Dashboard.tsx`, `KarmaActionModal.tsx`, and `frameworkMethodService.ts`.
- Removed `merit_type` / `merit_size` fields from the `/calendar` new-task form; merit is only evaluated after a task has been applied in `/session`.
- Moved planned-completion slider (`Đánh giá mức độ hoàn thành kế hoạch`) and merit reflection (`Đo tâm & Đo Phúc`) into `/session` Step 4 (`Đưa khuôn trí tuệ vào Sống`). Selecting a task now shows earn/spend type, size picker, and opens `MeritReflectionModal`.
- Redesigned `/calendar` "Nhật ký" card with dynamic period selector (Ngày / Tuần / Tháng / Quý / Năm / Tùy chọn) and custom date inputs; removed the separate `Đời/Đạo/Lợi tư` and `Sổ Phúc` lists below the calendar. The journal now shows period summary, applied frameworks, completed tasks, merit totals, recurring events, and karma events for the selected range.
- Added a global sticky round `+` FAB (`GlobalTaskFab`) on every protected page for quick task creation.
- Redesigned the `Lễ giỗ, tế họ` calendar preset to open a user-input modal for custom title, date, warning days, and preparation note before creating a `RecurringTask`.
- Dashboard hero card renamed from "Trận chiến Nghiệp — Phúc" to "Nghiệp - Phúc của bạn trong kiếp này".
- Dashboard framework-usage card now shows real stats: top completed block, top practiced step (Đưa khuôn / Bám theo dõi), day with most merit earned, and day with most merit spent / Ân oán.
- Validation: `npm run lint -w framework-method` ✅, `npm run type-check -w framework-method` ✅, `npm run test -w framework-method` ✅, `npm run build -w framework-method` ✅.

## 2026-08-04 (Gamify Nghiệp vs Phúc + Sổ Phúc reflection)

- Renamed Dashboard section label `dashboard.frameworks` to "Đưa khuôn trí tuệ vào cuộc sống" (vi) / "Apply wisdom frameworks to life" (en); `activeFramework` and `backToFramework` keys normalized to lowercase "framework" in English and "Khuôn" in Vietnamese.
- Extended `DailyTask` with `merit_reflected`, `merit_points`, `reflection_outcome`, and `reflection_mind`; `calculateMerit` now only counts points after the user has reflected and confirmed the score.
- Added `MeritReflectionModal` component for the "Đo tâm & Đo Phúc" step: user records outcome, mind state, and final merit points before the task is counted.
- Added a dedicated "Sổ Phúc" section on `/calendar` that lists all tasks with a merit type, shows current create/spend/total, and opens the reflection modal per task.
- Split the `/calendar` "Trổ canh" card into "Cảnh hiện tại" (current monthly/quarterly), "Cảnh tương lai" (upcoming), and "Lịch sử cảnh" (past) sections.
- Redesigned `/dashboard` hero card as "Trận chiến Nghiệp — Phúc": side-by-side karma balance vs merit earned, opposing progress bars, countdown to next Trổ canh, and four action buttons: Nhận ra / Dừng nghiệp / Đọc Sám / Giải cảnh.
- Extended `KarmaActionModal` and `performKarmaAction` with a new `recite` action for "Đọc Sám / Sám hối" prepayment against an upcoming Trổ canh.
- Renamed `nav.session` to "Đưa khuôn trí tuệ vào Sống" (vi) / "Apply wisdom to life" (en).
- Merged `History` into `/calendar`: removed the standalone `History` page, route, and navigation entry; selecting any date in the calendar now reveals a day-detail "Nhật ký ngày" panel showing frameworks applied (`applyPlans`/`tracks`), completed `Đời/Đạo/Lợi tư` tasks, earned/spent merit, recurring events due that day, and `Trổ canh` karma events.
- Split `KnowledgeEntry` into three content levels: `Cốt ý` (`summary`), `Cốt của Cốt` (`cot_cua_cot`), and `Lõi` (`loi`/`content`); added form fields and search support; old `content` remains the fallback `Lõi` value for backward compatibility.
- Validation: `npm run lint -w framework-method` ✅, `npm run type-check -w framework-method` ✅, `npm run test -w framework-method` ✅, `npm run build -w framework-method` ✅.

## 2026-08-04 (Nghiệp báo + Trổ canh)

- Added the `KarmaAccount`, `KarmaEvent`, `KarmaPayment`, and `KarmaTemplate` types plus `DEFAULT_KARMA_TEMPLATE_ROWS` for a per-user Nghiệp báo gamification system.
- Each user starts with 1000 Nghiệp báo points. Daily positive `merit.total` offsets reduce the balance; monthly and quarterly `Trổ canh` events reserve and deduct 20 points when triggered.
- Added `getKarmaAccount`, `saveKarmaAccount`, `getKarmaEvents`, `saveKarmaEvents`, `getKarmaPayments`, `saveKarmaPayments`, `getKarmaTemplate`, `saveKarmaTemplate`, `generateKarmaEvents`, `getKarmaEventCountdown`, `syncKarmaEvents`, `updateKarmaDailyOffset`, and `performKarmaAction` in `frameworkMethodService.ts` (localStorage + Supabase fallback).
- `SessionContext` loads the karma account, auto-generates monthly/quarterly `Trổ canh` events, syncs triggered events on load, and updates the daily offset whenever `merit.total` changes.
- `Dashboard` now shows the remaining Nghiệp báo balance, a progress bar, and the countdown to the next Trổ canh with "Dừng nghiệp" / "Giải cảnh" actions.
- `Calendar` includes a "Trổ canh" section listing upcoming monthly/quarterly events, their countdown/status (`Chưa nhận ra`, `Đã nhận ra`, `Đã giải cảnh`, `Đã tự động trừ`), and action buttons.
- Added `KarmaActionModal` component for `Nhận ra`, `Dừng nghiệp`, and `Giải cảnh` actions. It captures note, image URL, and an editable `Khuôn dừng nghiệp` table (target + money) that persists as the user's karma template.
- `KarmaActionModal` now accepts an `initialAction` prop so `Dashboard` and `Calendar` action buttons open directly on the correct tab; `Dashboard` karma buttons are disabled until `karma.nextEvent` has loaded.

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
- Added `CALENDAR_PRESETS` quick-add cards on `/calendar` for common Vietnamese recurring schedules: "Mồng 1 & 15 âm lịch", "10 ngày ăn chay", and "Lễ giỗ, tế họ". Each preset creates ready-to-use `RecurringTask` entries.
- Refactored Step 3 (`dua_khuon`) apply templates to be block-specific: `Gia đình`, `Công việc`, `Quan hệ`, and `Tài chính` each get their own default checklist items; `Bản thân` keeps the generic execution-plan items. Builder still allows editing these templates.
- Fully implemented `Kiểm soát Tài chính` (`/finance`): income entry with `estimate`/`exact` modes, exact-mode date + installment splitting, and allocation into 5 buckets (`family`, `savings`, `merit_debt`, `reinvest`, `personal`) with per-bucket notes; totals and per-category summaries are shown. `IncomeEntry`/`FinanceExpense` types and `getFinanceIncome`/`saveFinanceIncome`/`getFinanceExpenses`/`saveFinanceExpenses` helpers added to `frameworkMethodService.ts`.
- Updated Step 2 reflection labels to "Quy chiếu" / "Quy chiếu bên ngoài" / "Quy chiếu bên trong" in `vi.json`/`en.json`.
- Replaced the Builder "Ví dụ" knowledge dropdown with a free-text rich-text editor and upgraded per-item `content_vi`/`content_en` inputs to the same `RichTextEditor`. The editor supports bold, italic, heading, unordered list, and image URL insertion. Added `example_content_vi`/`example_content_en` to `TemplateSection`; `SessionPage` renders both item content and section example content as HTML.
- Added `nav.finance`, `nav.practice`, `calendar.*`, `financeControl.*`, and `practice.*` i18n keys to `vi.json`/`en.json`.
- Validation: `npx tsc -p apps/framework-method/tsconfig.app.json --noEmit` ✅, `npm run lint -w framework-method` ✅, `npm run test -w framework-method` ✅, `npm run build -w framework-method` ✅.
- `/calendar` new-task form now includes a "Việc định kỳ" checkbox; when checked it reveals recurrence, warning lead time, and preparation-note fields and saves the task as a `RecurringTask`. The old standalone recurring-task form was removed; recurring tasks still appear in the same list with `Chốt làm` conversion.
- Made `Template.step_type` a `string` and added `name_vi`/`name_en`/`order_index` to `Template`; `frameworkMethodService.ts` now provides `DEFAULT_STEP_CONFIG`, `normalizeTemplates`, `getOrderedStepTypes`, and `createCustomTemplate`.
- Builder now supports per-block custom step creation (inserted after the selected step), reordering with up/down arrows, and deletion of custom steps. `SessionPage` derives step labels and step count dynamically from `SessionContext.stepTypes`; built-in `recognize`/`apply`/`track` steps retain their specialized UIs regardless of position, while any other step type renders a generic `GenericStep`.

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
