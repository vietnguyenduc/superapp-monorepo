# Superapp Monorepo

> Hệ sinh thái 7 ứng dụng quản trị doanh nghiệp F&B, xây dựng bằng Turborepo + React + Supabase.

## Kiến trúc tổng thể

```mermaid
graph TD
    subgraph Frontend["Frontend (React + Vite + Tailwind)"]
        AP[Admin Portal :5173]
        CF[Cashflow :5174]
        INV[Inventory :5175]
        SAL[Sales :5176]
        HR[HR :5177]
        ACC[Accounting :5178]
        OPS[Operations :3006]
    end

    subgraph Packages["Shared Packages"]
        UI[@repo/ui]
        IAM[@superapp/iam]
        HOOKS[@repo/hooks]
        UTILS[@repo/shared-utils]
        THEME[@repo/theme]
        TYPES[@repo/types]
        TRIAL[@superapp/trial-client]
    end

    subgraph Backend["Backend"]
        SB[(Supabase PostgreSQL)]
        API[API Server :3001]
    end

    Frontend --> Packages
    Packages --> SB
    Frontend --> API
    API --> SB
```

## Applications

| App | Port | URL (prod) | Docs |
|-----|------|------------|------|
| Admin Portal | 5173 | https://admin.appforyou.xyz | [docs/](./apps/admin-portal/docs/) |
| Cashflow | 5174 | https://cashflow.appforyou.xyz | [docs/](./apps/cashflow/docs/) |
| Inventory Operation | 5175 | https://inventory.appforyou.xyz | [docs/](./apps/inventory-operation/docs/) |
| Sales Operation | 5176 | https://sales.appforyou.xyz | [docs/](./apps/sales-operation/docs/) |
| HR Operation | 5177 | https://hr.appforyou.xyz | [docs/](./apps/hr-operation/docs/) |
| Accounting | 5178 | https://accounting.appforyou.xyz | [docs/](./apps/accounting/docs/) |
| Operations Portal | 3006 | https://ops.appforyou.xyz | [docs/](./apps/operations-portal/docs/) |

## Shared Packages

| Package | Purpose | Docs |
|---------|---------|------|
| `@repo/ui` | Component library (DataTable, AuthProvider, Layout) | [docs/](./packages/ui/docs/) |
| `@superapp/iam` | Auth, RBAC, CompanyContext, Trial manager | [docs/](./packages/iam/docs/) |
| `@repo/hooks` | Shared React hooks | [docs/](./packages/hooks/docs/) |
| `@repo/shared-utils` | Supabase client, API client, import/export | [docs/](./packages/shared-utils/docs/) |
| `@repo/theme` | Tailwind preset, design tokens, Apple CSS | [docs/](./packages/theme/docs/) |
| `@repo/types` | TypeScript types (Database, Product, Customer) | [docs/](./packages/types/docs/) |
| `@superapp/trial-client` | Trial mode (use apps without login) | [docs/](./packages/trial-client/docs/) |

## Root Documentation

| Document | Purpose |
|----------|---------|
| [docs/README.md](./docs/README.md) | Documentation index |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture |
| [docs/CODING-STANDARDS.md](./docs/CODING-STANDARDS.md) | Code guidelines |
| [docs/DATABASE-SCHEMA.md](./docs/DATABASE-SCHEMA.md) | Database schema |
| [docs/AUTH-AND-RBAC.md](./docs/AUTH-AND-RBAC.md) | Auth & RBAC system |
| [docs/TRIAL-SYSTEM.md](./docs/TRIAL-SYSTEM.md) | Trial mode system |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Deployment guide |
| [docs/DATA-MIGRATION.md](./docs/DATA-MIGRATION.md) | Data migration |
| [docs/DEV-ENVIRONMENT.md](./docs/DEV-ENVIRONMENT.md) | Dev environment setup |

## Quick Start

### Prerequisites
- Node.js >= 20
- npm >= 10
- Supabase project (shared: `peslmsctejmvkwzyohke`)

### Installation
```bash
npm install
```

### Development
```bash
# Start all apps
npm run dev:apps

# Start specific app
npx turbo run dev --filter=cashflow

# Build all
npm run build

# Type check
npm run type-check
```

### Environment
Copy `.env.example` to each app's `.env.local` and fill in Supabase credentials.

## AI-Assisted Development

Mỗi app có `docs/AI-CONTEXT.md` cung cấp context cho AI agents:

```text
I'm working on the [app-name] app in the superapp-monorepo.
Read apps/[app-name]/docs/AI-CONTEXT.md for project context.
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + npm workspaces |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (Apple-inspired) |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| API | Express.js (packages/api) |
| Deploy | Vercel (frontend) + Supabase (backend) |
| Auth | Supabase Auth + JWT + RLS |
| Multi-tenancy | company_id + Row Level Security |

## License

Private — All rights reserved.
