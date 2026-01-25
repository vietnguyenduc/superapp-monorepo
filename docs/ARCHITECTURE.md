# SuperApp Monorepo - Architecture Documentation

> **Last Updated**: 2026-01-24

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
| Backend (future) | Supabase |

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
│   │   ├── database.ts    # Main service exports
│   │   ├── mockData.ts    # Static mock data
│   │   └── sampleData.ts  # Generated sample data
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
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   UI Layer  │────▶│   Services   │────▶│  Mock Data  │
│  (React)    │◀────│ (database.ts)│◀────│  (Future:   │
│             │     │              │     │  Supabase)  │
└─────────────┘     └──────────────┘     └─────────────┘
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

### Current (Development)
- Mock data only, no real authentication
- No sensitive data stored

### Future (Production)
- Supabase authentication
- Row-level security (RLS)
- API key management via environment variables

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

## 🔄 State Management

### Current Approach
- React useState/useEffect for local state
- Props drilling for component communication
- Service layer for data fetching

### Future Considerations
- Context API for global state (auth, theme)
- React Query for server state management

---

## 📝 Coding Standards

See [CODING_STANDARDS.md](./CODING_STANDARDS.md) for detailed guidelines.

### Quick Reference
- TypeScript strict mode
- Functional components with hooks
- Named exports preferred
- i18n for all user-facing text
- TailwindCSS for styling
