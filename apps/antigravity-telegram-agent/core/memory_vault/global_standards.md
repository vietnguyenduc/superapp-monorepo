# Monorepo Global Coding Standards & Architectural Memories

This document acts as the global shared context (Memory Vault) for the Antigravity Telegram Agent across all applications in this monorepo. It establishes strict rules, patterns, and memories to prevent architectural divergence.

---

## 0. 📜 HIẾN PHÁP DỰ ÁN — Kim Chỉ Nam Bất Di Bất Dịch

> **Đây là tôn chỉ cao nhất. Mọi quyết định kỹ thuật đều phải đi qua bộ lọc này trước.**

### Nguyên Tắc I — Xây Đúng Hơn Sửa Đúng

**Triết lý cốt lõi**: Đơn giản, bền vững, đúng từ gốc, dễ maintain — đó là đỉnh cao kỹ thuật, không phải sự phức tạp.

- ✅ **Build right** > Fix right. Nền móng sai thì mọi thứ xây trên đó đều lung lay — sửa cái này hỏng cái kia.
- ✅ **Simplicity wins**. Giải pháp đơn giản nhất giải quyết được bài toán là giải pháp tốt nhất.
- ✅ **Sustainability over cleverness**. Code phải dễ đọc, dễ sửa, dễ bàn giao — 6 tháng sau vẫn hiểu ngay.
- ✅ **Pragmatic, not perfectionist**. Ship được, chạy được, đo được — rồi mới refine.
- ❌ **NEVER** patch over a wrong foundation. Nếu gốc sai → rebuild, không workaround.
- ❌ **NEVER** add complexity to solve problems created by existing complexity.
- ❌ **NEVER** cho rằng "để sau refactor" — technical debt cộng dồn theo cấp số nhân.

**Checklist trước khi code:**
1. Cách này 6 tháng sau có dễ hiểu không?
2. Nếu cái này hỏng, có dễ isolate và fix không?
3. Có đang workaround 1 design sai không? Nếu có → fix design trước.

---

### Nguyên Tắc II — Testing Là Nghệ Thuật, Không Phải Thủ Tục

**Triết lý**: Testing không phải là checkbox cuối cùng — đó là gương phản chiếu chất lượng của toàn bộ hệ thống. Đây là **điểm mạnh nhất của dự án** và phải được phối hợp agentic một cách nhịp nhàng.

**5 Chiều Testing Bắt Buộc (Agentic Collaborative Testing Framework):**

| Chiều | Câu hỏi | Tool/Bot |
|-------|---------|---------|
| **Spec** | Người dùng cần gì? Journey của họ là gì? | Agent phân tích requirements, viết user stories |
| **Flow** | Họ thao tác từng bước như thế nào? | Flow diagram, step-by-step walkthrough |
| **UI/UX** | Họ có làm được không? Dễ hay khó? | `/browser` snapshot, OCR analysis, mobile screenshot |
| **Function** | Khi bấm vào, mọi thứ chạy đúng không? | Console check, click test, debug, error trace |
| **Data** | Dữ liệu có chính xác, đủ, đúng schema không? | Migration check, Supabase query, RLS validation |

**Quy trình Agentic Testing:**
1. 📋 **Plan rõ ràng trước**: Viết `test_plan.md` với scope, chiều test, expected outcomes
2. 🤝 **Phối hợp bot**: Telegram Agent điều phối, `/browser` chụp UI, `/teamwork` chia việc parallel
3. 🔍 **Test từ ngoài vào trong**: User journey → UI → API → Database (không skip tầng nào)
4. 📸 **Evidence-based**: Mọi phát hiện phải có screenshot, console log, hoặc query result
5. 📝 **Document findings**: Ghi vào vault, không để lỗi "bay" không ai nhớ

**Rules:**
- ❌ NEVER consider a feature "done" nếu chưa test ít nhất UI + Function + Data
- ❌ NEVER test chỉ bằng cách đọc code — phải chạy thực tế
- ✅ ALWAYS dùng `/browser` để có visual evidence khi test UI/UX
- ✅ ALWAYS kiểm tra Supabase migration + RLS khi có data changes

---

## 1. Monorepo Directory Layout & Tech Stack

*   **Vite Operational Apps (Vite + React + Tailwind CSS)**:
    *   `apps/accounting` (Port 3001): Operational accounting app.
    *   `apps/admin-portal` (Port 3002): Identity & configuration management.
    *   `apps/cashflow` (Port 3003): Cashflow forecasting & transaction logs.
    *   `apps/hr-operation` (Port 3004): Payroll, attendance, and employee records.
    *   `apps/inventory-operation` (Port 3005): Stock, suppliers, MRP, goods receipt.
    *   `apps/operations-portal` (Port 3006): Unified internal operations gateway.
    *   `apps/sales-operation` (Port 3007): Sales orders, invoices, and billing.
*   **Next.js Portal (Next.js 15 + React 19)**:
    *   `apps/web` (Port 3000): Public portal.
*   **Shared Packages**:
    *   `packages/ui`: Design system, shared UI components, Google Sheets integration.
    *   `packages/hooks`: Unified hooks (e.g., `useSupabaseClient`, `useAuth`).
    *   `packages/shared-utils`: Constants and helper functions.

---

## 2. Authentication & Authorization (IAM)

*   All operational apps must use the unified authentication system from `@superapp/iam` (defined in `packages/ui` / `packages/hooks`).
*   **User Roles (`UserRole` enum)**:
    *   `ADMIN`: Full access to settings, users, databases, and financial configs.
    *   `STAFF`: Operational access.
    *   `WAREHOUSE_KEEPER`: (Inventory specific) Restricted to Goods Receipt, stock counts. No configuration/settings.
    *   `WAREHOUSE_ACCOUNTANT`: Full access to stock value, MRP, billing integrations.
*   **Standard Auth Pattern**:
    *   Wrap protected routes in `<ProtectedRoute>` from `components/auth/ProtectedRoute`.
    *   Access active user details via custom hook:
        ```typescript
        const { user } = useAuth();
        const userRole = user?.role || UserRole.STAFF;
        ```

---

## 3. Database & Supabase Integration

*   **Row Level Security (RLS)**:
    *   Every table MUST have RLS enabled.
    *   RLS policies must enforce tenancy isolation (by `company_id` and `branch_id`).
*   **Migrations**:
    *   All schema changes must be declared inside `supabase/migrations/` using incremental, clean SQL files.

---

## 4. UI & Layout Standards (Vibe Coding Guidelines)

*   **Mobile-Responsive Design**:
    *   Operational Vite apps must employ a responsive container model.
    *   On desktop: Clean sidebar navigation layout.
    *   On mobile (especially inside Telegram WebApp): Use bottom navigation `MobileBottomNav` with an elegant **"Thêm" (More)** button as the 5th tab to trigger a smooth bottom sheet menu drawer (`MobileMenuDrawer`). This prevents clipping by Telegram's native title headers.
*   **No Placeholders**:
    *   Use actual sample data. If images are required, request standard asset generation.
*   **Micro-Animations & Harmonies**:
    *   Standard color palettes: Sleek dark modes or harmonized modern Outfit/Inter typography. Avoid generic colors.

---

## 5. Architectural Memory & Active Tasks

*   **AppSwitcher Patch (Done)**:
    *   Fixed a critical React child rendering bug in `AppSwitcher.tsx` across all Vite operational apps by wrapping dynamic menu maps inside standard wrapper tags instead of empty fragments.
*   **Settings Tech Align (Done)**:
    *   Synchronized Vite configs and corrected `settings.json` to assign `"tech": "React"` for the five operational Vite apps, preventing Next.js binary conflicts on port activations.

---

## 6. Strict Vault Logging & Memory Preservation Rules

*   **Mandatory Synchronization**: Both the Telegram Bot agent and the local Antigravity IDE agent must strictly record progress, plans, and outcomes into the vault files.
*   **Active Project Logs**: Upon completing any significant task or milestone, the agents must proactively create/update the active project's vault:
    1.  **Task Lists (`vault/task.md`)**: Mark completed tasks, list in-progress work, and maintain upcoming TODOs.
    2.  **Implementation Plans (`vault/plan...md`)**: Document structural blueprints, affected files, and execution strategies.
    3.  **Local Memory Artifacts (`core/memory_vault/`)**: Automatically compile task objectives, execution strategies, and lessons learned into `.md` files accompanied by `.json` embedding vectors for seamless hybrid RAG lookup.

---

## 7. File System Operations & Mock Data Standards

*   **Smart Path Resolution**:
    *   The agent supports both workspace-relative paths (e.g., `src/pages/SettingsPage.tsx`) and monorepo-root-relative paths (e.g., `apps/inventory-operation/src/pages/SettingsPage.tsx`).
*   **Targeted Modifications vs. Full Write**:
    *   **Editing existing files**: NEVER use `write_file` for large existing files. Always use `patch_file` or `replace_file_content` to perform targeted modifications. This prevents accidental overwriting of untouched code and avoids truncation issues.
    *   **Creating new files**: `write_file` is allowed for new files up to 30,000 characters.
*   **Mock Data & Seeding Optimization (Generator Script Pattern)**:
    *   Do NOT generate massive static JSON or TypeScript arrays (exceeding 4k chars) directly using `write_file`.
    *   **Best Practice**: Write a lightweight generator script (e.g., a short Node.js or Python script) that programmatically constructs the required mock data and saves it to the target file.
    *   Execute the script using `execute_command` (e.g., `node generate_mock.js` or `python seed.py`).
    *   This is highly token-efficient, immune to truncation, and scales to any dataset size.


