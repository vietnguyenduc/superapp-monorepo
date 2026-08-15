# Architecture — Superapp Monorepo

> Tổng quan kiến trúc toàn hệ thống. Đọc file này trước khi làm việc với bất kỳ app nào.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Phone                         │
│  (Tailscale → Windows → netsh portproxy → WSL → Vite dev)     │
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
                             │  Primary data source in production
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL)                         │
│  Auth · RLS · Triggers · RPCs · Realtime                         │
│  50+ migrations · Multi-tenant (company_id)                      │
│  Single source of truth for production                           │
└─────────────────────────────────────────────────────────────────┘

Local/AI development (optional):

┌──────────────────┐      health-check       ┌──────────────────┐
│   Vite dev app   │ ── /health on :3001 ──▶ │  packages/api    │
│  (localhost)     │                         │  (InsForge local)│
└──────────────────┘                         └────────┬─────────┘
     │                                                │
     │            if InsForge is healthy              │
     │◀──────── route .from() / .rpc() via API ───────┘
     │                                                │
     └────────────────────►  local Postgres mirror  ──┘
```

## Monorepo Structure

```
superapp-monorepo/
├── apps/                          # 7 Vite Superapp apps + framework-method (separate project) + insforge-infra + deprecated superapp-business-bot
│   ├── admin-portal/              # 5173 — Company/staff/permission management
│   ├── cashflow/                  # 5174 — Cash flow management
│   ├── inventory-operation/       # 5175 — Inventory management (F&B)
│   ├── sales-operation/           # 5176 — Sales & POS
│   ├── hr-operation/              # 5177 — HR, payroll, attendance
│   ├── accounting/                # 5178 — Accounting, invoices, assets
│   ├── operations-portal/         # 3006 — Operations portal
│   ├── framework-method/          # 5179 — Separate personal project (not part of Superapp core docs)
│   ├── insforge-infra/            # InsForge infrastructure (gateway, deepwiki, mcp)
│   └── superapp-business-bot/     # deprecated leftover (no package.json)
├── packages/                      # 12 shared packages
│   ├── shared-utils/              # @superapp/shared-utils — Supabase client, API, types
│   ├── ui/                        # @repo/ui — React component library
│   ├── hooks/                     # @repo/hooks — Shared React hooks
│   ├── iam/                       # @superapp/iam — Auth, permissions, company context
│   ├── theme/                     # @superapp/theme — Tailwind preset, design tokens
│   ├── trial-client/              # @superapp/trial-client — Trial mode seed data
│   ├── types/                     # @repo/types — TypeScript types, Database types
│   ├── typescript-config/         # @repo/typescript-config — Shared tsconfig presets
│   ├── eslint-config/             # @repo/eslint-config — Shared ESLint config
│   ├── api/                       # superapp-api — Fastify API server (port 3001)
│   ├── einvoice/                  # @superapp/einvoice — E-invoice integration
│   └── insforge-mcp/              # @superapp/insforge-mcp — MCP server for OpenHands
├── supabase/
│   └── migrations/                # 69+ SQL migration files
├── docs/                          # ← You are here
├── AGENTS.md                      # AI agent rules
├── turbo.json                     # Turborepo task config
└── package.json                   # Root workspace config
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + npm workspaces |
| Frontend | React 18 (target) + TypeScript 5.8 + Vite 8. `@repo/ui` and `operations-portal` currently on React 19 / TS 6.0.2 while transitioning. |
| Styling | Tailwind CSS + Apple-inspired design system |
| Backend | Supabase (PostgreSQL + Auth + Realtime + RLS) — primary |
| Local AI/test gateway | `packages/api` (InsForge) + local Postgres mirror — optional |
| State | React hooks + custom hooks (no Redux) |
| Components | `@repo/ui` shared library |
| Auth | `@superapp/iam` (Supabase Auth + JWT claims + RBAC) |

## Package Dependency Graph

```
@repo/types ←── @superapp/shared-utils ←── apps/*
                    ↑
@superapp/iam ──────┘
@repo/ui ──────────── apps/*
@repo/hooks ───────── apps/*
@superapp/theme ───── apps/*
@superapp/trial-client ── apps/*
```

**Key rule**: Apps depend on packages. Packages can depend on other packages (e.g., `iam` depends on `shared-utils`). Apps never depend on other apps directly — cross-app communication happens via Supabase (triggers, shared tables) or the App Switcher (URL navigation).

## Cross-App Integration

Apps không gọi API của nhau trực tiếp. Thay vào đó:

1. **Supabase triggers**: Khi inventory nhập kho → trigger tạo pending cashflow transaction
2. **Shared tables**: `companies`, `branches`, `users` dùng chung qua tất cả apps
3. **App Switcher**: `@repo/ui` export `AppSwitcher` component, dùng `@superapp/shared-utils/app-urls.ts` để resolve URL
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
`@superapp/shared-utils/supabase/client.ts` dùng custom `cookieStorage` với domain `.appforyou.xyz` (prod) hoặc `localhost` (dev). Khi user login ở `admin.appforyou.xyz`, session cookie share sang `cashflow.appforyou.xyz` — không cần login lại.

### 3. Supabase-first data routing with optional InsForge local mirror
Apps use `apiClient` (from `@superapp/shared-utils/createApiClient`) which defaults to **Supabase cloud** in production. In local dev, if `packages/api` (InsForge) is running on `localhost:3001`, `apiClient` transparently switches to the local gateway so AI agents and dev experiments can query a local Postgres mirror without touching production data.

- Production (`*.appforyou.xyz`): always Supabase.
- Local dev: auto-detect InsForge; fallback to Supabase if not reachable.
- Trial mode (`localStorage.setItem('isTrial', 'true')`) uses `@superapp/trial-client` and does not call either backend.

### 4. No Redux / no global state library
State management = React hooks (`useState`, `useReducer`, custom hooks trong `@repo/hooks`). Mỗi app tự quản lý state cục bộ. Cross-app state = Supabase Realtime subscriptions.

### 5. Vite, not Next.js
Tất cả apps dùng Vite (SPA), không phải Next.js (SSR). Lý do: đơn giản, fast HMR, đủ cho dashboard apps. `next-env.d.ts` tồn tại trong một số apps là artifact cũ, không dùng.

## See Also

- [DATA-ROUTING.md](./DATA-ROUTING.md) — Supabase primary + InsForge local mirror, workflow thêm schema, và cách AI dùng database
- [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) — Chi tiết schema và migrations
- [AUTH-AND-RBAC.md](./AUTH-AND-RBAC.md) — Auth flow và permission system
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Vercel deployment
- [DEV-ENVIRONMENT.md](./DEV-ENVIRONMENT.md) — WSL/Tailscale setup
