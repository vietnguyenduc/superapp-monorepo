# Superapp Monorepo — Documentation Index

> Tài liệu tập trung cho toàn bộ monorepo. Mỗi app có thư mục `docs/` riêng (xem bên dưới).

## Root Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Monorepo architecture, Turborepo, package graph | Dev, AI |
| [CODING-STANDARDS.md](./CODING-STANDARDS.md) | Code conventions, lint, format, commit rules | Dev, AI |
| [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) | Cross-app Supabase schema, 50+ migrations, RLS | Dev, DBA |
| [AUTH-AND-RBAC.md](./AUTH-AND-RBAC.md) | Auth system, JWT claims, multi-tenancy, roles | Dev, AI |
| [TRIAL-SYSTEM.md](./TRIAL-SYSTEM.md) | Trial seed system architecture | Dev, PM |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel deployment, CI/CD, env vars | DevOps |
| [DATA-MIGRATION.md](./DATA-MIGRATION.md) | Data migration hub (import/export) | Dev, PM |
| [DATA-ROUTING.md](./DATA-ROUTING.md) | Supabase primary + InsForge local mirror, AI workflow | Dev, AI, DevOps |
| [DEV-ENVIRONMENT.md](./DEV-ENVIRONMENT.md) | WSL/Tailscale/dashboard dev setup | Dev, DevOps |

## App Documentation

Mỗi app có 12 file docs chuẩn trong `apps/<app>/docs/`:

| File | Role |
|------|------|
| `OVERVIEW.md` | App là gì, mục đích, scope, target users |
| `PRD.md` | Product Requirements: features, user stories, acceptance criteria |
| `ARCHITECTURE.md` | Tech stack, component structure, folder layout |
| `DATA-MODEL.md` | DB tables, schema, relationships, RLS policies |
| `DATA-FLOW.md` | Data flow diagrams, state management, caching |
| `UI-UX.md` | Pages, navigation, design system, components |
| `FLOWS.md` | Business flows, user journeys, workflows |
| `API.md` | API endpoints, Supabase RPCs, triggers |
| `ROLES-PERMISSIONS.md` | RBAC roles, permissions matrix |
| `RUNBOOK.md` | Run/debug/deploy/troubleshoot |
| `AI-CONTEXT.md` | Quick context cho AI assistant |
| `CHANGELOG.md` | Lịch sử thay đổi |

### Apps

| App | Port | Docs | Production URL |
|-----|------|------|----------------|
| Admin Portal | 5173 | [docs](../apps/admin-portal/docs/) | https://admin.appforyou.xyz |
| Cashflow | 5174 | [docs](../apps/cashflow/docs/) | https://cashflow.appforyou.xyz |
| Inventory | 5175 | [docs](../apps/inventory-operation/docs/) | https://inventory.appforyou.xyz |
| Sales & POS | 5176 | [docs](../apps/sales-operation/docs/) | https://sales.appforyou.xyz |
| HR & Payroll | 5177 | [docs](../apps/hr-operation/docs/) | https://hr.appforyou.xyz |
| Accounting | 5178 | [docs](../apps/accounting/docs/) | https://accounting.appforyou.xyz |
| Operations | 3006 | [docs](../apps/operations-portal/docs/) | https://ops.appforyou.xyz |

## Package Documentation

| Package | Docs |
|---------|------|
| `@superapp/shared-utils` | [docs](../packages/shared-utils/docs/) |
| `@repo/ui` | [docs](../packages/ui/docs/) |
| `@repo/hooks` | [docs](../packages/hooks/docs/) |
| `@superapp/iam` | [docs](../packages/iam/docs/) |
| `@superapp/theme` | [docs](../packages/theme/docs/) |
| `@superapp/trial-client` | [docs](../packages/trial-client/docs/) |
| `@repo/types` | [docs](../packages/types/docs/) |

## Quick Start

```bash
# Install
npm install

# Run all apps in dev mode
npm run dev:apps

# Run single app
npx turbo run dev --filter=cashflow

# Build all
npm run build

# Type check
npm run type-check
```

See [DEV-ENVIRONMENT.md](./DEV-ENVIRONMENT.md) for WSL/Tailscale setup.
