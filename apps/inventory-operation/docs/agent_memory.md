# Project Agent Memory

This file contains learned lessons, bug fixes, and architectural rules discovered during development. The AI should read this to avoid repeating mistakes.

### Lesson Recorded on 2026-06-14 02:28
Testing the signature fix.

### Lesson Recorded on 2026-06-14 02:47
## UUID Parse Error Fix — inventoryMovementService.ts

**Problem:** `InventoryRecordsPage.tsx` dòng 18 dùng `const companyId = selectedCompany?.id || 'trial-company'`. Khi user không có company (trial), `companyId` là string `'trial-company'` không phải UUID. Service gọi `eq('company_id', 'trial-company')` → Supabase trả về `invalid input syntax for type uuid: "1"` (22P02).

**Fix:** Thêm UUID guard pattern trong `inventoryMovementService.ts`:
```typescript
const companyId = filters.companyId;
if (companyId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId)) {
  return this.getMockMovements(filters); // fallback to mock data
}
```
Áp dụng cho: `getMovements`, `getCurrentBalance`, `getVarianceReport`.

**Lesson:** Không bao giờ gửi non-UUID string lên Supabase column có type UUID. Luôn validate UUID format trước khi query. Nếu không hợp lệ, dùng mock data ngay lập tức thay vì để Supabase trả về lỗi 22P02.

### Lesson Recorded on 2026-06-14 09:02
## RLS Infinite Recursion Fix — auth.jwt() Pattern

**Problem:** All policies ON `public.users` table that use `SELECT FROM public.users` in their USING/WITH CHECK clause cause infinite recursion. This affects migrations 002, 005, 008, 025, 030.

**Fix:** Replace self-referencing subqueries with `auth.jwt() -> 'user_metadata' ->> 'role'` and `auth.jwt() -> 'user_metadata' ->> 'company_id'` to read role/company_id directly from JWT claims instead of querying the users table.

**Pattern:**
```sql
-- BEFORE (infinite recursion):
CREATE POLICY "x" ON public.users FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
);

-- AFTER (safe):
CREATE POLICY "x" ON public.users FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin_master'
);
```

**Lesson:** NEVER write a SELECT subquery on the same table that the policy is ON. Always use `auth.jwt()` for role/company checks on the `users` table itself.

### Lesson Recorded on 2026-06-14 09:02
## Telegram Bot Error Handling — ReadTimeout & 502 Bad Gateway

**Problem:** The Telegram bot agent experiences periodic `ReadTimeout` (25s) and `502 Bad Gateway` errors when polling `api.telegram.org`. These are transient network issues that cause the polling thread to crash and restart.

**Root Cause:** Network instability between the local machine and Telegram's API servers. The 25s read timeout is too short for intermittent connectivity.

**Fix Applied:** The bot auto-recovers via `infinity_polling()` which restarts the polling thread on exception. However, during the ~30s recovery window, user messages may be lost.

**Recommendation:** 
1. Increase read timeout from 25s to 45s in the TeleBot constructor
2. Add a retry decorator with exponential backoff for API calls
3. Implement a message queue to buffer messages during polling downtime

### Lesson Recorded on 2026-06-14 09:02
## Gemini API Free Tier Quota Management

**Problem:** The Gemini API free tier has a strict limit of 20 requests/day for `gemini-2.5-flash`. Once exhausted, all subsequent calls fail with `429 RESOURCE_EXHAUSTED` and the error message "Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20".

**Impact:** The `run_visual_audit` tool and memory vault generation both depend on Gemini Vision/Text, causing them to fail silently after quota exhaustion.

**Fix Applied:** None (quota is per-day and resets). The system falls back to DeepSeek for text generation.

**Recommendation:**
1. Upgrade to paid tier ($0.15/1M input tokens) to get 2000 RPM
2. OR implement a quota-aware router that checks remaining quota before calling Gemini
3. OR cache Gemini responses for repeated visual audits
4. OR use Ollama (local, free) for visual analysis as fallback

### Lesson Recorded on 2026-06-14 15:09
## Git Push Protection — Secret Scanning Block

**Problem:** GitHub push protection blocked a commit containing `SUPABASE_ACCESS_TOKEN=sbp_...` in a session memory vault file. The error was `GH013: Repository rule violations found`.

**Fix:** 
1. Find the secret: `git grep -n "sbp_" HEAD --`
2. Replace the secret in the file content
3. Amend the commit: `git add <file> && git commit --amend --no-edit`
4. Push again

**Lesson:** Never commit API keys, tokens, or secrets in any file — including memory vaults, logs, or documentation. Always use environment variables or `.env` files. If a secret is accidentally committed, use `git commit --amend` (if latest commit) or `git filter-branch` (if older commit) to remove it before pushing.

### Lesson Recorded on 2026-06-15 02:05
## Visual Audit Findings — 2026-06-15

**Critical Issues Found via `run_visual_audit` on inventory-operation:**

1. **Table Responsiveness (HIGH PRIORITY):** Dashboard + Product Management tables are broken on mobile (375px) and iPad (768px). Columns cut off (Status, Total, Stock, Actions). No horizontal scroll. Fix: wrap tables in `overflow-x: auto` container, or transform rows to card layout on mobile.

2. **Sticky Bottom Navigation Overlap (HIGH PRIORITY):** On mobile, the bottom tab bar overlaps content on Dashboard, Product Management, and Settings pages. The "Save Settings" button is hidden. Fix: add `padding-bottom` to main content equal to bottom nav height (~80px).

3. **Desktop Layout Underutilization (MEDIUM):** Main content area is constrained to fixed max-width, leaving large empty spaces on 1440px viewport. Consider allowing content to expand for data-heavy pages.

**Pattern for future audits:** Always use `run_visual_audit` with `auth_click_selector="text=Dùng thử"` to bypass login. The tool auto-starts server, takes screenshots on 3 viewports, and runs Gemini Vision analysis.
