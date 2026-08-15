# ADR 0001 — Documentation Alignment & AI Onboarding Decisions

## Status

Accepted — 2026-08-04

## Context

Sau 120+ PR, docs `README.md`, `AGENTS.md` và các `apps/<app>/docs` đã lệch so với thực trạng codebase:

- Số app, tên package, stack kỹ thuật ghi sai hoặc thiếu.
- Nhiều app thiếu `AI-CONTEXT.md` / `ARCHITECTURE.md`, gây khó khăn cho agent mới.
- Một số quyết định kiến trúc (kiểu `id`, React version) không thống nhất giữa code, schema và docs.

## Decisions

1. **Danh sách app chuẩn**
   - 7 app Vite production trong hệ sinh thái Superapp: `admin-portal`, `cashflow`, `inventory-operation`, `sales-operation`, `hr-operation`, `accounting`, `operations-portal`.
   - `apps/framework-method/` là dự án cá nhân riêng, docs gói gọn trong `apps/framework-method/docs/`; không đưa vào docs chung của 7 app Superapp.
   - `apps/superapp-business-bot/` là artifact cũ (không có `package.json`), không phải app Vite; giữ lại `config/` nhưng ghi chú deprecated trong docs.
   - `apps/insforge-infra/` là Docker infra, không phải app Vite, không deploy Vercel.

2. **Kiểu cột `id`**
   - Giữ `text` cho `customers.id`, `transactions.id`, `bank_accounts.id`, `branches.id` theo migration `041_customers_id_text.sql`.
   - Code vẫn sinh v4 UUID string (`crypto.randomUUID()`), lưu vào cột `text`. Docs/code comment phải ghi rõ "text type containing a v4 UUID string", không ghi "uuid type".

3. **React / TypeScript versions**
   - Chuẩn hóa toàn repo về **React 18** + **TypeScript 5.8**.
   - Cập nhật `@repo/ui` và `operations-portal` từ React 19 / TS 6.0.2 về React 18 / TS 5.8; các app còn lại đã đúng chuẩn.

4. **Backend API**
   - `packages/api` là **Fastify**, không phải Express.

5. **Cấu trúc docs chuẩn**
   - Mỗi app có 12 file trong `apps/<app>/docs/`: `OVERVIEW.md`, `PRD.md`, `ARCHITECTURE.md`, `DATA-MODEL.md`, `DATA-FLOW.md`, `UI-UX.md`, `FLOWS.md`, `API.md`, `ROLES-PERMISSIONS.md`, `RUNBOOK.md`, `AI-CONTEXT.md`, `CHANGELOG.md`.
   - Root `docs/` có: `README.md`, `ARCHITECTURE.md`, `PROJECT_CONTEXT.md`, `DEPLOYMENT.md`, `DATA-ROUTING.md`, `LESSONS_LEARNED_AND_NEW_APP_PLAYBOOK.md`, `SUPABASE_SCHEMA_HEALTH_REPORT.md`, plus `CODING-STANDARDS.md` and `DATABASE-SCHEMA.md` (new) or merged equivalents.

6. **New app onboarding**
   - Tạo `tools/new-app-generator/` (nằm ngoài `apps/`) — app HTML đơn giản giúp tạo nhanh skeleton cho các app khác.
   - Trong monorepo, tạo `docs/NEW-APP-TEMPLATE/` với skeleton code, docs mẫu và checklist.

## Consequences

- Agent mới đọc docs sẽ nắm đúng app list, stack, kiểu `id`.
- `README.md` và `AGENTS.md` cần cập nhật theo quyết định này.
- Không thay đổi schema production (id vẫn `text`).
