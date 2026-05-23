# Superapp Monorepo

A comprehensive monorepo for F&B management applications built with Turborepo, featuring shared UI components, shared auth, standardized data migration capabilities, and multi-tenant capabilities.

## Architecture Overview

This monorepo leverages Turborepo to orchestrate a unified ecosystem of applications:

### Applications
- **`apps/cashflow`**: Cash flow management application. Integrates securely with inventory and sales data.
- **`apps/inventory-operation`**: Inventory management system for F&B operations.
- **`apps/sales-operation`**: Sales tracking and POS management application.
- **`apps/docs`**: Documentation site (planned).

### Shared Packages
- **`@repo/ui`**: Shared React component library with an Apple-like design system. Includes complex components like `DataTable` and `AuthProvider`.
- **`@repo/hooks`**: Shared custom React hooks (`useDebounce`, `usePagination`, `useRealtimeSubscription`).
- **`@repo/shared-utils`**: Common logic, utilities, API fetchers, and the shared Supabase authentication module.
- **`@repo/theme`**: Shared styling definitions, tokens, and Tailwind configuration presets.
- **`@repo/eslint-config`**: Standardized ESLint configurations for React and internal libraries.
- **`@repo/typescript-config`**: Base TypeScript configurations used across all workspaces.

### Database & Security (Supabase)
We use a centralized Supabase project. The `supabase/migrations/` folder manages the unified schema.
- **Cross-app Triggers**: Database triggers automatically sync activities across apps (e.g., inventory imports or sales orders auto-create pending cashflow transactions).
- **Multi-Tenancy**: The `company_id` column provides a secure, tenant-level isolation layer across all major tables using Row Level Security (RLS).
- **Authentication**: Role-based access control (RBAC) securely restricts visibility based on `app_permissions` and `staff_permissions`.

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
We use Turborepo for efficient task execution. Run these from the root directory:

- `npm run dev`: Start all apps in development mode concurrently.
- `npm run build`: Build all apps and packages.
- `npm run lint`: Run ESLint across all workspaces.
- `npm run format`: Format code across the monorepo using Prettier.
- `npm run type-check`: Run TypeScript compilation check.

To run a task for a specific app, use the `--filter` flag:
```bash
npx turbo run dev --filter=cashflow
```

## Data Migration Hub

🚀 **NEW**: Comprehensive data migration system for seamless transition from manual/legacy workflows:
- **Excel-like Interface**: Familiar grid editing experience
- **Multi-source Import**: Excel, Google Sheets, CSV, manual input
- **Smart Validation**: Real-time data validation with user-friendly messages

📚 **Documentation**:
- [Data Migration Hub Architecture](./docs/DATA-MIGRATION-HUB.md)
- [Development Rules & Standards](./docs/DATA-MIGRATION-RULES.md)

## 🤖 AI-Assisted Development (Vibe Coding)

This project is optimized for AI-assisted development. Each app contains an `AI_CONTEXT.md` file that helps AI assistants understand the project quickly.

### Quick Start for AI Sessions
```text
I'm working on the [app-name] app in the superapp-monorepo. 
Please read AI_CONTEXT.md in apps/[app-name]/ for project context.
```

### Key Documentation
| Document | Purpose |
|----------|---------|
| `apps/*/AI_CONTEXT.md` | AI assistant context (read first!) |
| `docs/ARCHITECTURE.md` | System architecture |
| `docs/CODING_STANDARDS.md` | Code guidelines |
| `CONTRIBUTING.md` | How to contribute |

### After Each AI Session
Update the `AI_CONTEXT.md` file with:
- What was completed
- Current issues
- Next steps

