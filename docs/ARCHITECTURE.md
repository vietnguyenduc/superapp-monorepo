# Architecture — Superapp Monorepo

> Tổng quan kiến trúc toàn hệ thống. Đọc file này trước khi làm việc với bất kỳ app nào.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Phone                           │
│  (Tailscale → Windows → netsh portproxy → WSL → Vite dev)       │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS (prod) / HTTP (dev)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Vite Dev Servers (WSL)                       │
│  apps/admin-portal:5173  apps/cashflow:5174                     │
│  apps/inventory:5175     apps/sales:5176                        │
│  apps/hr:5177            apps/accounting:5178                   │
│  apps/operations:3006    packages/api:3001                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ Supabase JS Client (anon key)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL)                         │
│  Auth · RLS · Triggers · RPCs · Realtime                         │
│  50+ migrations · Multi-tenant (company_id)                     │
└─────────────────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
superapp-monorepo/
├── apps/                          # 7 production apps + web
│   ├── admin-portal/              # 5173 — Company/staff/permission management
│   ├── cashflow/                  # 5174 — Cash flow management
│   ├── inventory-operation/       # 5175 — Inventory management (F&B)
│   ├── sales-operation/           # 5176 — Sales & POS
│   ├── hr-operation/              # 5177 — HR, payroll, attendance
│   ├── accounting/                # 5178 — Accounting, invoices, assets
│   ├── operations-portal/         # 3006 — Operations portal
│   └── web/                       # Landing page / docs site
├── packages/                      # Shared packages
│   ├── shared-utils/              # @repo/shared-utils — Supabase client, API, types
│   ├── ui/                        # @repo/ui — React component library
│   ├── hooks/                     # @repo/hooks — Shared React hooks
│   ├── iam/                       # @superapp/iam — Auth, permissions, company context
│   ├── theme/                     # @repo/theme — Tailwind preset, design tokens
│   ├── trial-client/              # @superapp/trial-client — Trial mode seed data
│   ├── types/                     # @repo/types — TypeScript types, Database types
│   ├── typescript-config/         # Shared tsconfig presets
│   └── insforge-mcp/              # MCP server integration
├── supabase/
│   └── migrations/                # 50+ SQL migration files
├── docs/                          # ← You are here
├── AGENTS.md                      # AI agent rules
├── turbo.json                     # Turborepo task config
└── package.json                   # Root workspace config
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + npm workspaces |
| Frontend | React 18 + TypeScript 5.8 + Vite 8 |
| Styling | Tailwind CSS + Apple-inspired design system |
| Backend | Supabase (PostgreSQL + Auth + Realtime + RLS) |
| State | React hooks + custom hooks (no Redux) |
| Components | `@repo/ui` shared library |
| Auth | `@superapp/iam` (Supabase Auth + JWT claims + RBAC) |
| Deployment | Vercel (per-app) |
| Dev environment | WSL2 Ubuntu + Tailscale |

## Package Dependency Graph

```
@repo/types ←── @repo/shared-utils ←── apps/*
                    ↑
@superapp/iam ──────┘
@repo/ui ──────────── apps/*
@repo/hooks ───────── apps/*
@repo/theme ───────── apps/*
@superapp/trial-client ── apps/*
```

**Key rule**: Apps depend on packages. Packages can depend on other packages (e.g., `iam` depends on `shared-utils`). Apps never depend on other apps directly — cross-app communication happens via Supabase (triggers, shared tables) or the App Switcher (URL navigation).

## Cross-App Integration

Apps không gọi API của nhau trực tiếp. Thay vào đó:

1. **Supabase triggers**: Khi inventory nhập kho → trigger tạo pending cashflow transaction
2. **Shared tables**: `companies`, `branches`, `users` dùng chung qua tất cả apps
3. **App Switcher**: `@repo/ui` export `AppSwitcher` component, dùng `@repo/shared-utils/app-urls.ts` để resolve URL
4. **JWT claims**: User login 1 lần, JWT chứa `app_permissions` + `role` + `company_id`, tất cả apps đọc từ đó

## Turborepo Task Pipeline

```json
{
  "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
  "lint": { "dependsOn": ["^lint"] },
  "check-types": { "dependsOn": ["^check-types"] },
  "test": { "dependsOn": [], "outputs": ["coverage/**"] },
  "dev": { "cache": false, "persistent": true }
}
```

- `^build` = build dependencies first (packages before apps)
- `dev` is persistent (long-running, not cached)
- `dev:apps` runs all 7 apps concurrently with `--concurrency=16`

## Key Design Decisions

### 1. Multi-tenancy via `company_id`
Mọi table business đều có `company_id` column + RLS policy `auth.jwt() ->> 'company_id'`. Một Supabase project serve nhiều companies.

### 2. Cookie-based session sharing
`@repo/shared-utils/supabase/client.ts` dùng custom `cookieStorage` với domain `.appforyou.xyz` (prod) hoặc `localhost` (dev). Khi user login ở `admin.appforyou.xyz`, session cookie share sang `cashflow.appforyou.xyz` — không cần login lại.

### 3. Trial mode without backend
`@superapp/trial-client` cho phép dùng app mà không cần Supabase. Seed data fetch từ API `localhost:3001/api/trial/:table`, mutations lưu in-memory. Toggle bằng `localStorage.setItem('isTrial', 'true')`.

### 4. No Redux / no global state library
State management = React hooks (`useState`, `useReducer`, custom hooks trong `@repo/hooks`). Mỗi app tự quản lý state cục bộ. Cross-app state = Supabase Realtime subscriptions.

### 5. Vite, not Next.js
Tất cả apps dùng Vite (SPA), không phải Next.js (SSR). Lý do: đơn giản, fast HMR, đủ cho dashboard apps. `next-env.d.ts` tồn tại trong một số apps là artifact cũ, không dùng.

## See Also

- [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) — Chi tiết schema và migrations
- [AUTH-AND-RBAC.md](./AUTH-AND-RBAC.md) — Auth flow và permission system
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Vercel deployment
- [DEV-ENVIRONMENT.md](./DEV-ENVIRONMENT.md) — WSL/Tailscale setup
