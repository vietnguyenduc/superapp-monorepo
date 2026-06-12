# Monorepo Global Coding Standards & Architectural Memories

This document acts as the global shared context (Memory Vault) for the Antigravity Telegram Agent across all applications in this monorepo. It establishes strict rules, patterns, and memories to prevent architectural divergence.

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


