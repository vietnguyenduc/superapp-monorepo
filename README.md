# Superapp Monorepo

A comprehensive monorepo for F&B management applications built with npm workspaces, featuring shared UI components, shared auth, standardized data migration capabilities, and multi-tenant capabilities.

## Architecture Overview

This monorepo leverages npm workspaces to orchestrate a unified ecosystem of 7 applications + 13 shared packages:

### Applications (7 Vite apps + 1 Docker infra)

| App | Port | Domain | Purpose |
|-----|------|--------|---------|
| `apps/admin-portal` | 5173 | `admin.appforyou.xyz` | Multi-company management, user/role admin, trial seed editor |
| `apps/cashflow` | 5174 | `cashflow.appforyou.xyz` | Cash flow management: transactions, bank accounts, reports |
| `apps/inventory-operation` | 5175 | `inventory.appforyou.xyz` | Inventory: products, stock movements, variance reporting |
| `apps/sales-operation` | 5176 | `sales.appforyou.xyz` | Sales orders + POS for F&B: customers, sales reports, bulk import |
| `apps/hr-operation` | 5177 | `hr.appforyou.xyz` | HR & Payroll 3P: employees, contracts, salary calculation |
| `apps/accounting` | 5178 | `accounting.appforyou.xyz` | Accounting: journal entries, invoices, e-invoice, fixed assets |
| `apps/operations-portal` | 3006 | `ops.appforyou.xyz` | Operations portal: shift management, training, quizzes |
| `apps/insforge-infra` | 7130/7131 | (Docker, not Vercel) | InsForge Gateway (DeepSeek proxy) + DeepWiki (vector search) |

### Shared Packages (13)

| Package | Purpose |
|---------|---------|
| `@superapp/iam` | Auth + multi-tenant context (`AuthProvider`, `CompanyProvider`, `useAuth`, `useCompany`) |
| `@superapp/ui` | Shared React component library (Apple-inspired design, `DataTable`, modals, etc.) |
| `@superapp/hooks` | Shared React hooks (`useDebounce`, `usePagination`, `useRealtimeSubscription`) |
| `@superapp/data-client` | Supabase client wrapper + shared business logic (data adapters) |
| `@superapp/trial-client` | Trial mode client — reads from `trial_seed.data` table |
| `@superapp/types` | Shared TypeScript types (User, Company, UserRole, etc.) |
| `@superapp/api` | Fastify API server (port 3001) — trial seeds, utilities |
| `@superapp/einvoice` | E-invoice integration (for Accounting app) |
| `@superapp/theme` | Tailwind theme tokens (Apple-inspired) |
| `@superapp/shared-utils` | Common logic, utilities, API fetchers |
| `@superapp/insforge-mcp` | InsForge MCP server (DB tools for OpenHands) |
| `@superapp/eslint-config` | Shared ESLint config |
| `@superapp/typescript-config` | Shared tsconfig |

### Database & Security (Supabase)

We use a centralized Supabase project (`peslmsctejkwzyohke`). The `supabase/migrations/` folder (38+ files) manages the unified schema.
- **Multi-Tenancy**: `company_id` column + Row Level Security (RLS) — `USING (company_id = (auth.jwt() ->> 'company_id')::uuid)`. NOT schema-per-tenant.
- **Authentication**: `@superapp/iam` + Supabase Auth (JWT-based). RBAC via `app_permissions` and `staff_permissions`.
- **Cross-app Triggers**: Database triggers sync activities across apps (e.g., inventory imports auto-create pending cashflow transactions).

## Getting Started

### Prerequisites
- Node.js >= 18
- `npm` >= 10
- A Supabase project (for database/auth)

### Installation
1. Clone the repository and install dependencies:
```bash
npm install
```

2. **Environment Variables**
Copy the master `.env.example` to your application roots (`apps/cashflow/.env.local`, `apps/sales-operation/.env.local`, etc.) and fill in your Supabase credentials:
```bash
cp .env.example apps/cashflow/.env.local
cp .env.example apps/sales-operation/.env.local
```

### Monorepo Scripts

- `npm run dev:apps`: Start all 7 Vite apps in development mode concurrently.
- `npm run build`: Build all apps and packages.
- `npm run lint`: Run ESLint across all workspaces.
- `npm run type-check`: Run TypeScript compilation check.

To run a task for a specific app, use the workspace flag:
```bash
npm run dev -w apps/cashflow
```

## Documentation

- **Root docs** (`docs/`): 9 files — README, ARCHITECTURE, CODING-STANDARDS, DATABASE-SCHEMA, AUTH-AND-RBAC, TRIAL-SYSTEM, DEPLOYMENT, DATA-MIGRATION, DEV-ENVIRONMENT.
- **App docs** (`apps/<app>/docs/`): 12 files per app — OVERVIEW, ARCHITECTURE, API, FLOWS, DATA-MODEL, DATA-FLOW, UI-UX, PRD, ROLES-PERMISSIONS, RUNBOOK, AI-CONTEXT, CHANGELOG.
- **Agent rules** (`AGENTS.md`): Single source of truth for AI agents — read §0 first (60-second orientation).

## AI-Assisted Development

This project is optimized for AI-assisted development (OpenHands, Devin, Windsurf).

### Quick Start for AI Sessions
```text
Read AGENTS.md §0 (Quick Start for new agents) first.
Then read apps/<app-name>/docs/AI-CONTEXT.md for the specific app.
```

### Key Documentation
| Document | Purpose |
|----------|---------|
| `AGENTS.md` | Agent rules — single source of truth (read §0 first!) |
| `apps/*/docs/AI-CONTEXT.md` | Per-app AI context |
| `docs/ARCHITECTURE.md` | System architecture |
| `docs/CODING-STANDARDS.md` | Code guidelines |
