# PROJECT MAP

**Project Name:** Cashflow Management System  
**Purpose:** Multi-tenant web application for tracking customer transactions, managing branch-level cash flow, and generating financial reports.  
**Last Updated:** 2026-05-01

---

# CORE FEATURES

1. **Authentication & RBAC**
   - Email/password login via Supabase Auth
   - Role-based access: Admin, Branch Manager, Staff
   - Granular staff permissions (`staff_permissions` JSONB)

2. **Customer Management**
   - Create / edit / deactivate customers
   - Bulk import from Excel/CSV (≤200 rows)
   - Customer balance tracking (opening → current → total)

3. **Transaction Management**
   - Create / edit / delete transactions
   - Configurable transaction types (per company, with color & math factor)
   - Bulk import transactions linked to customers

4. **Dashboard & Reporting**
   - Key metrics: total customers, transactions, balance by branch
   - Transaction type breakdown (pie chart)
   - Recent transactions & top customers

5. **System Settings**
   - Company & branch management
   - Bank account management
   - Transaction type & color settings
   - User preferences & backup history

6. **Multi-tenancy**
   - `company_id` isolation across all tables
   - Branch-level data segmentation

---

# SYSTEM MODULES

## Frontend Modules

| Module | Pages / Components |
|--------|-------------------|
| Dashboard | `DashboardPage`, metric cards, charts (`Recharts`) |
| Customers | `CustomerListPage`, `CustomerImportPage`, `CustomerForm` |
| Transactions | `TransactionListPage`, `TransactionImportPage`, `TransactionForm` |
| Settings | `SettingsPage` (branches, bank accounts, transaction types, users) |
| Auth | `LoginPage`, `useAuth` hook, `AuthContext` |
| Layout | `Layout` (sidebar, header, dark-mode aware) |

## Service Layer Modules

| Module | Key Exports |
|--------|-------------|
| `databaseService` | `customers`, `transactions`, `transactionTypes`, `branches`, `bankAccounts`, `users`, `dashboard`, `reports`, `colorSettings`, `backupHistory` |
| `supabase.ts` | Supabase client singleton (`createClient`) |
| `trialMockStore.ts` | Offline/demo fallback data (localStorage) |
| `businessLogic.ts` | Validation helpers, transformers |

---

# DATA FLOW

```
User Action
    ↓
React Component (useAuth / useState)
    ↓
Service Layer (databaseService.xxx)
    ↓
Supabase JS Client ──→ PostgreSQL (RLS enforced)
    ↑                      ↑
Auth session JWT      auth.users ↔ public.users
    ↑
Edge Function (create-user) [post-signup trigger]
```

**Offline fallback:** When Supabase is unreachable, `trialMockStore.ts` serves mock data from `localStorage` for demo mode.

---

# DEPENDENCIES

| Service | Purpose | Environment Var |
|---------|---------|-----------------|
| Supabase (PostgreSQL + Auth) | Primary database, auth, RLS | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Supabase Edge Functions | Server-side user creation (`create-user`) | — |
| Vercel | Frontend hosting | `VERCEL_TOKEN` |
| Recharts | Dashboard charts | — |
| react-i18next | i18n (en / vi) | — |

---

# HIGH LEVEL ARCHITECTURE

```
┌─────────────────────────────┐
│   React 18 + Vite + TS      │
│  TailwindCSS + Recharts     │
├─────────────────────────────┤
│  AuthContext │ useAuth      │
│  databaseService (CRUD)      │
├─────────────────────────────┤
│      Supabase JS Client     │
└──────────────┬────────────────┘
               │ HTTP / WebSocket
┌──────────────▼──────────────┐
│   Supabase Platform         │
│  Auth │ PostgreSQL │ RLS     │
│  Edge Functions (create-user)│
└──────────────────────────────┘
```