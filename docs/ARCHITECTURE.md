# SuperApp Monorepo - Architecture Documentation

> **Last Updated**: 2026-05-01
> **Merged from:** `ARCHITECTURE.md` (root), `apps/cashflow/docs/architecture.md`

---

## 📁 Repository Structure

```
superapp-monorepo/
├── apps/                    # Application packages
│   ├── cashflow/           # Cash flow management app
│   ├── inventory-operation/ # Inventory operations app
│   └── [other-apps]/       # Future applications
├── packages/               # Shared packages (if any)
├── docs/                   # Documentation
└── package.json            # Root package.json (workspaces)
```

---

## 🏗️ Monorepo Architecture

### Workspace Management
- **Tool**: npm workspaces
- **Structure**: Each app is independent but can share packages

### Running Individual Apps
```bash
# Run specific app
npm run dev --workspace=cashflow
npm run dev --workspace=inventory-operation

# Build specific app
npm run build --workspace=cashflow
```

---

## 📱 Application: Cashflow

### Purpose
Business cash flow management system for tracking:
- Customer debts and payments
- Income and expenses
- Bank account balances
- Multi-branch operations

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript |
| Build | Vite |
| Styling | TailwindCSS |
| Charts | Recharts |
| i18n | react-i18next |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |

### Directory Structure
```
apps/cashflow/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── UI/            # Basic UI elements (Button, Input, etc.)
│   │   └── Layout/        # Layout components
│   ├── pages/             # Page components
│   │   ├── Dashboard/     # Main dashboard
│   │   ├── Customers/     # Customer management
│   │   └── Transactions/  # Transaction management
│   ├── services/          # Data services
│   │   ├── database.ts    # Main service exports (Supabase client)
│   │   ├── supabase.ts    # Supabase client configuration
│   │   ├── trialMockStore.ts  # Offline/demo fallback data
│   │   └── businessLogic.ts   # Validation & transformers
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── locales/           # i18n translations
│   │   ├── en/           # English
│   │   └── vi/           # Vietnamese
│   └── types/             # TypeScript type definitions
├── AI_CONTEXT.md          # AI assistant context file
└── package.json
```

### Data Flow
```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   UI Layer  │────▶│   Services   │────▶│    Supabase     │
│  (React)    │◀────│ (database.ts)│◀────│ (PostgreSQL +   │
│             │     │              │     │  Auth + RLS)    │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                           ▼ (offline / demo fallback)
                    ┌──────────────┐
                    │ trialMockStore│
                    │ (localStorage)│
                    └──────────────┘
```

### Service Interface
```typescript
// Main export from database.ts
export const databaseService = {
  dashboard: {
    getDashboardMetrics(branchId?, timeRange): Promise<DashboardMetrics>
  },
  customers: {
    getCustomers(filters?): Promise<Customer[]>
    getCustomerById(id): Promise<Customer>
    createCustomer(data): Promise<Customer>
    updateCustomer(id, data): Promise<Customer>
    deleteCustomer(id): Promise<void>
  },
  transactions: {
    getTransactions(filters?): Promise<Transaction[]>
    createTransaction(data): Promise<Transaction>
    // ...
  },
  bankAccounts: {
    getBankAccounts(): Promise<BankAccount[]>
    // ...
  },
  branches: {
    getBranches(): Promise<Branch[]>
    // ...
  }
};
```

---

## 🔐 Security Considerations

### Production (Active)
- **Supabase Authentication** (`auth.users` ↔ `public.users` sync)
- **Row-Level Security (RLS)** enabled on all tables; policies restrict data by `company_id` / `branch_id` / role
- **API key management** via `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`
- **RBAC** granular permissions stored in `users.staff_permissions` JSONB

### Development / Trial Fallback
- Offline demo mode uses `trialMockStore.ts` (localStorage) when Supabase is unreachable
- No real auth in trial mode; do **not** use for production data

---

## 🌐 Internationalization (i18n)

### Supported Languages
- English (en) - Default
- Vietnamese (vi)

### Translation Structure
```json
// locales/en/translation.json
{
  "dashboard": {
    "title": "Dashboard",
    "cashFlowChart": "Cash Flow Chart",
    "timeLabels": {
      "months": {
        "january": "January",
        // ...
      }
    }
  }
}
```

### Usage in Components
```typescript
const { t } = useTranslation();
return <h1>{t("dashboard.title")}</h1>;
```

### Consistency Rules
- Always add new keys to **both** `vi.json` and `en.json`.
- Missing keys will render the raw key string in UI; confirm in Vietnamese mode.
- Avoid hardcoded Vietnamese in components; prefer `t("...")`.

---

## 📊 Dashboard Components

### CashFlowChart
- **Purpose**: Visualize cash flow over time
- **Features**:
  - Time range filters (Day, Week, Month, Quarter, Year)
  - Dynamic data aggregation
  - Waterfall chart visualization
  - Running total calculation

### MetricsCard
- **Purpose**: Display key metrics with change indicators
- **Data**: Outstanding balance, active customers, transactions

### BalanceByBankChart
- **Purpose**: Show balance distribution across bank accounts

---

## 🧭 Layout & UI Guidelines

### Sidebar + Layout Widths
- Sidebar width is defined in `Layout.tsx` and `Sidebar.tsx`; keep them aligned to avoid clipped actions.
- If updating `Sidebar` width, update:
  - Desktop container width in `Layout.tsx`
  - Mobile slide-over width in `Layout.tsx`
  - Sidebar root width in `Sidebar.tsx`

### Dark Mode Hygiene
- Any `bg-white`/light background must include a `dark:` variant.
- Check dashboard cards, tables, modals, and import pages for white blocks in dark mode.

---

## 🔄 State Management

### Current Approach
- **React useState/useEffect** for local component state
- **Context API** for global state: `AuthContext` (session, user profile), `TransactionTypeContext` (deduplicated type cache)
- **Service layer** (`database.ts`) for all Supabase CRUD
- **Trial mock store** (`trialMockStore.ts`) for offline/demo mode

### Future Considerations
- React Query (TanStack Query) for server state caching & deduplication
- Zustand or Jotai if prop drilling becomes painful beyond current scope

---

## 📝 Coding Standards

See [CODING_STANDARDS.md](./CODING_STANDARDS.md) for detailed guidelines.

### Quick Reference
- TypeScript strict mode
- Functional components with hooks
- Named exports preferred
- i18n for all user-facing text
- TailwindCSS for styling
