# operations-portal — Changelog

## 2026-08-04 — Dịch thông báo lỗi Trial Mode

- `src/lib/supabase.ts`: thông báo lỗi Trial Mode chuyển sang tiếng Việt.

## 2026-08-12 — RLS-safe reads, tenant validation

- `src/pages/ChatPage.tsx`, `CheckInPage.tsx`, `DocumentsPage.tsx`, `TicketsPage.tsx`, `TrainingPage.tsx`: đọc profile user bằng `.maybeSingle()`, validate `company_id` trước khi insert.
