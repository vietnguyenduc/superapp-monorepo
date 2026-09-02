# Superapp Monorepo

> Hệ sinh thái 7 ứng dụng quản trị doanh nghiệp F&B, xây dựng bằng Turborepo + React + Vite + Supabase.

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

    subgraph Other["Other Projects"]
        FM[Framework Method :5179]
    end

    subgraph Packages["Shared Packages"]
        UI[@repo/ui]
        IAM[@superapp/iam]
        HOOKS[@repo/hooks]
        UTILS[@superapp/shared-utils]
        THEME[@superapp/theme]
        TYPES[@repo/types]
        TRIAL[@superapp/trial-client]
        EINV[@superapp/einvoice]
        MCP[@superapp/insforge-mcp]
    end

    subgraph Backend["Backend"]
        SB[(Supabase PostgreSQL)]
        API_SRV[API Server :3001]
    end

    Frontend --> Packages
    Packages --> SB
    Frontend --> API_SRV
    API_SRV --> SB
    IAM --> SB
    FM --> SB
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

> `apps/framework-method/` is a separate personal project (port 5179, `https://framework.appforyou.xyz`) and is not part of the core 7-app Superapp documentation set.

## Shared Packages

| Package | Purpose | Docs |
|---------|---------|------|
| `@repo/ui` | Component library (DataTable, AuthProvider, Layout) | [src/](./packages/ui/src/) |
| `@superapp/iam` | Auth, RBAC, CompanyContext, Trial manager | [src/](./packages/iam/src/) |
| `@repo/hooks` | Shared React hooks | [src/](./packages/hooks/src/) |
| `@superapp/shared-utils` | Supabase client, API client, import/export | [src/](./packages/shared-utils/src/) |
| `@superapp/theme` | Tailwind preset, design tokens, Apple CSS | [src/](./packages/theme/src/) |
| `@repo/types` | TypeScript types (Database, Product, Customer) | [src/](./packages/types/src/) |
| `@superapp/trial-client` | Trial mode (use apps without login) | [src/](./packages/trial-client/src/) |
| `@superapp/einvoice` | E-invoice integration (Accounting) | [src/](./packages/einvoice/src/) |
| `@superapp/insforge-mcp` | InsForge MCP server (DB tools for agents) | [src/](./packages/insforge-mcp/src/) |
| `superapp-api` | Fastify API server (port 3001) | [src/](./packages/api/src/) |
| `@repo/eslint-config` | Shared ESLint config | [package/](./packages/eslint-config/) |
| `@repo/typescript-config` | Shared tsconfig presets | [package/](./packages/typescript-config/)

## Root Documentation

| Document | Purpose |
|----------|---------|
| [docs/README.md](./docs/README.md) | Documentation index |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture |
| [docs/PROJECT_CONTEXT.md](./docs/PROJECT_CONTEXT.md) | Current state, recent fixes, known issues |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Deployment guide |
| [docs/DATA-ROUTING.md](./docs/DATA-ROUTING.md) | Supabase + InsForge local mirror |
| [docs/LESSONS_LEARNED_AND_NEW_APP_PLAYBOOK.md](./docs/LESSONS_LEARNED_AND_NEW_APP_PLAYBOOK.md) | Lessons & new-app playbook |
| [docs/SUPABASE_SCHEMA_HEALTH_REPORT.md](./docs/SUPABASE_SCHEMA_HEALTH_REPORT.md) | Schema health report |
| [docs/DEV-ENVIRONMENT.md](./docs/DEV-ENVIRONMENT.md) | **Windows + WSL setup guide** — cài đặt local dev environment |
| [AGENTS.md](./AGENTS.md) | AI agent rules & workflow |

> Missing root docs (`CODING-STANDARDS.md`, `DATABASE-SCHEMA.md`, `AUTH-AND-RBAC.md`, `TRIAL-SYSTEM.md`, `DATA-MIGRATION.md`) will be created or merged into existing docs as part of the documentation alignment effort.

## Quick Start

> **Windows users:** Repo này yêu cầu WSL 2 + Ubuntu. Xem hướng dẫn đầy đủ tại [docs/DEV-ENVIRONMENT.md](./docs/DEV-ENVIRONMENT.md).

### Prerequisites
- **WSL 2 + Ubuntu** (yêu cầu trên Windows — lockfile chứa native bindings Linux-only)
- Node.js >= 20 (cài trong WSL: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs`)
- npm >= 10
- Supabase project (shared: `peslmsctejkwzyohke`)

### Installation
```bash
# Trong WSL Ubuntu — clone vào ~/ (KHÔNG dùng /mnt/c hoặc /mnt/e)
cd ~
git clone https://github.com/vietnguyenduc/superapp-monorepo.git
cd superapp-monorepo
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
| Frontend | React 18 + TypeScript 5.8 + Vite 8 (standardized across the repo) |
| Styling | Tailwind CSS (Apple-inspired) |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| API | Fastify (`packages/api`, port 3001) |
| Deploy | Vercel (frontend) + Supabase (backend) |
| Auth | Supabase Auth + JWT + RLS |
| Multi-tenancy | company_id + Row Level Security |

## License

Private — All rights reserved.
