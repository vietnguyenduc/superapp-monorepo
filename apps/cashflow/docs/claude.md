# Cashflow App — Claude Context

## What This App Is

**Cashflow** is a Vietnamese-language business cash flow & debt management (quản lý công nợ) application. It tracks customer debts, financial transactions, bank account balances, and branch/office performance for multi-branch businesses. It lives inside a turborepo monorepo at `apps/cashflow/` alongside sibling apps (`web`, `inventory-operation`, `docs`).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 + TypeScript |
| **Build** | Vite (dev port `5174`) |
| **Styling** | TailwindCSS |
| **Charts** | Recharts (waterfall cash flow charts, balance-by-bank charts) |
| **i18n** | react-i18next (Vietnamese primary, English secondary) |
| **State** | React Context API + custom hooks |
| **Backend** | Supabase (PostgreSQL + Auth + RLS + Storage) |
| **Routing** | react-router-dom v6 |
| **Data Import** | `xlsx` library for Excel/CSV parsing |
| **Testing** | Vitest + React Testing Library + Cypress (E2E) |
| **Deployment** | Vercel (`vercel.json` present) |

## Project Structure

```
apps/cashflow/
├── src/
│   ├── App.tsx                  # Root component with router
│   ├── main.tsx                 # Entry point
│   ├── components/
│   │   ├── Auth/                # ProtectedRoute
│   │   ├── ErrorBoundary/       # Error boundary wrapper
│   │   ├── Import/              # Reusable import components
│   │   ├── Layout/              # App shell (sidebar + content)
│   │   └── UI/                  # Shared UI components
│   ├── pages/
│   │   ├── Auth/                # Login, SignUp
│   │   ├── CompanySelector/     # Multi-company selector for admins
│   │   ├── Dashboard/           # Metrics, charts, recent activity
│   │   ├── Customers/           # CustomerList, CustomerDetail
│   │   ├── Transactions/        # TransactionList
│   │   ├── DataImport/          # CustomerImport, TransactionImport
│   │   ├── Reports/             # Reporting page
│   │   └── Settings/            # App settings, RBAC, branch management
│   ├── services/
│   │   ├── database.ts          # Main data service (76KB, large — contains CRUD + mock data)
│   │   ├── supabase.ts          # Supabase client initialization
│   │   ├── api.ts               # API service layer
│   │   ├── mockData.ts          # Static mock data
│   │   └── sampleData.ts        # Generated sample data with realistic patterns
│   ├── contexts/
│   │   ├── AuthContext.tsx       # Authentication state provider
│   │   └── CompanyContext.tsx    # Company selection state
│   ├── hooks/
│   │   ├── useAuth.ts           # Auth hook (role, permissions, login/logout)
│   │   ├── useSession.ts        # Session management
│   │   ├── useI18n.ts           # Internationalization hook
│   │   ├── useDebounce.ts       # Input debounce
│   │   └── useLocalStorage.ts   # localStorage state persistence
│   ├── types/
│   │   ├── index.ts             # All app TypeScript types
│   │   └── database.types.ts    # Supabase-generated database types
│   ├── utils/
│   │   ├── rbac.ts              # Role-based access control logic
│   │   ├── validation.ts        # Form & data validation
│   │   ├── validationSystem.ts  # Extended validation system
│   │   ├── formatting.ts        # Number/currency formatting (K/M/B suffixes)
│   │   ├── importUtils.ts       # Import processing utilities
│   │   ├── dataCleaning.ts      # Data sanitization
│   │   ├── errorHandling.ts     # Centralized error handling
│   │   ├── backupRecovery.ts    # Backup & recovery utilities
│   │   └── constants.ts         # App-wide constants
│   ├── i18n/
│   │   ├── index.ts             # i18n configuration
│   │   └── locales/             # Translation JSON files (vi, en)
│   ├── config/
│   │   └── environment.ts       # Environment variable configuration
│   └── styles/                  # Additional CSS
├── db/
│   └── schema.sql               # Full PostgreSQL schema (491 lines)
├── shared/
│   ├── auth/                    # Shared auth utilities
│   ├── i18n/                    # Shared i18n utilities
│   └── ui/                      # Shared UI components
├── docs/                        # Project documentation (architecture, specs, flows)
├── specs/                       # Feature specifications
├── memory/                      # AI agent memory files (decision logs, bug logs)
├── tests/                       # Test files
├── scripts/                     # Deployment & utility scripts
└── dist/                        # Production build output
```

## Routes

| Route | Component | Auth |
|-------|-----------|------|
| `/login` | Login | Public |
| `/signup` | SignUp | Public |
| `/companies` | CompanySelector | Protected |
| `/dashboard` | Dashboard | Protected |
| `/customers` | CustomerList | Protected |
| `/customers/:customerId` | CustomerDetail | Protected |
| `/transactions` | TransactionList | Protected |
| `/reports` | Reports | Protected |
| `/settings` | Settings | Protected |
| `/import/transactions` | TransactionImport | Protected |
| `/import/customers` | CustomerImport | Protected |

Root `/` redirects to `/dashboard`.

## Database Schema (Supabase PostgreSQL)

### Core Tables
- **`branches`** — Business branches/offices with code, address, contact info
- **`users`** — App users with role enum (`admin`, `branch_manager`, `staff`), linked to branch, has `staff_permissions` JSONB for granular access
- **`customers`** — Customer records with `customer_code` (unique per branch), balances, credit limits, payment terms, assigned staff
- **`transactions`** — Financial transactions with type, amount, approval workflow (`pending`/`approved`/`rejected`), soft delete
- **`transaction_types`** — Configurable types (Thu tiền, Bán hàng, Chiết khấu, Phạt, Hoàn tiền, Điều chỉnh)
- **`bank_accounts`** — Bank accounts with balances, linked to branches
- **`audit_logs`** — Full audit trail (INSERT/UPDATE/DELETE with old/new values)
- **`system_settings`** — Key-value JSONB configuration store

### Key Database Features
- Row Level Security (RLS) enabled on all core tables
- Auto-updating `updated_at` triggers
- Audit triggers on customers, transactions, users, bank_accounts
- Customer balance auto-recalculation trigger on transaction changes
- Auto-generated customer codes (`CUST_BRANCHCODE_0001`) and transaction codes (`TXN_YYYYMMDD_0001`)
- Views: `customer_balance_view`, `transaction_summary_view`, `branch_performance_view`
- Functions: `get_customer_aging()`, `get_branch_metrics()`

## RBAC System

Three roles with hierarchical permissions:
- **Admin** — Full system access (12 permissions)
- **Branch Manager** — Branch-level management (7 permissions)
- **Staff** — Configurable via `staff_permissions` JSONB: `import_customers`, `import_transactions`, `view_reports`, `manage_settings`

Permission checks happen via `useAuth` hook and `rbac.ts` utility.

## Key Features

1. **Dashboard** — Metrics cards, cash flow waterfall chart, balance-by-bank chart, top customers, recent transactions
2. **Customer Management** — CRUD, search/filter, customer detail with transaction history
3. **Transaction Management** — List, create via modal, filter by type/branch/date
4. **Data Import** — Single-entry and bulk import (≤200 rows) for both customers and transactions, with validation, error reporting, and audit logging
5. **Reports** — Key metrics, customer balance, transaction reports, cash flow reports with export (CSV/JSON)
6. **Settings** — Branch/office management (edit/delete), user roles, staff permissions, system configuration
7. **Dark Mode** — Full dark mode with localStorage persistence
8. **Internationalization** — Vietnamese (primary) and English, switchable at runtime
9. **Multi-company** — Company selector for admin users managing multiple businesses

## Environment Variables

Required (prefix `VITE_` for Vite exposure):
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key
- `VITE_APP_ENV` — `development` | `staging` | `production`
- `VITE_DEFAULT_LOCALE` — Default `vi-VN`
- `VITE_DEFAULT_CURRENCY` — Default `VND`

## Development

```bash
# From monorepo root
npm install
npm run dev --workspace=cashflow

# From this directory
npm run dev          # Dev server on port 5174
npm run build        # Production build
npm run test         # Vitest
npm run lint         # ESLint
npm run format       # Prettier
```

## Known Issues & Technical Debt

- **RLS policy issues**: Users table had infinite recursion in RLS policies; fixes identified but may need re-verification
- **Auth-to-database sync**: User creation between Supabase Auth and the `users` table can fail silently — no retry logic yet
- **`database.ts` is very large** (76KB): Contains mixed concerns (CRUD operations, mock data generation, service interfaces). Should be broken into smaller modules.
- **Mock data coexistence**: Some mock/seed data logic is interleaved with real Supabase queries in `database.ts`; several backup copies exist (`database.complete.ts`, `database.fixed.ts`, etc.)
- **Trial mode**: Trial users can enter without auth via localStorage; banner offered instead of auto-redirect

## Conventions

- Use i18n keys for all user-facing text (never hardcode Vietnamese/English strings)
- TypeScript strict mode
- Mobile-first responsive design — always test mobile viewport
- Dark mode compatibility required for all UI changes
- Branch workflow: work in personal branch (e.g., `viet`), merge to `main` via PR
- Currency displayed in VND with smart K/M/B formatting and thousand separators
- Terminology: "Văn phòng" (office) not "Chi nhánh" (branch) in the UI
