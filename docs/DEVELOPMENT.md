# Development Guide

> **Merged from:** `DEVELOPMENT-SETUP.md`, `CODING_STANDARDS.md`, `PROJECT-STRUCTURE.md`, `I18N-SETUP.md`

Comprehensive guide for developers and AI agents working on the Cashflow Management System within the SuperApp monorepo.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Environment Setup](#environment-setup)
3. [Development Tools](#development-tools)
4. [Coding Standards](#coding-standards)
5. [Internationalization (i18n)](#internationalization-i18n)
6. [Testing](#testing)
7. [Git Workflow](#git-workflow)

---

## Project Structure

### Monorepo Layout
```
superapp-monorepo/
├── apps/
│   ├── cashflow/              # Cashflow Management System (React + Vite)
│   ├── inventory-operation/   # Inventory operations app
│   └── [future-apps]/
├── packages/                  # Shared packages (if any)
├── docs/                      # Cross-app documentation (this folder)
└── package.json               # Root workspace config
```

### Cashflow App Structure (`apps/cashflow/src/`)
```
src/
├── main.tsx               # Entry point
├── App.tsx                # Root component
├── index.css              # Global styles + Tailwind
├── components/
│   ├── UI/                # Reusable UI (Button, Input, Modal, Table, Card, Badge, Alert, Loading)
│   ├── Layout/            # Layout, Navigation, Sidebar
│   ├── Forms/             # CustomerForm, TransactionForm, ImportForm
│   ├── Dashboard/         # MetricsCard, Chart, RecentActivity
│   └── DataImport/        # ImportTable, ValidationErrors, FileUpload
├── pages/
│   ├── Auth/Login.tsx
│   ├── Dashboard/
│   ├── Customers/
│   ├── Transactions/
│   ├── DataImport/
│   ├── Reports/
│   └── Settings/
├── hooks/
│   ├── useAuth.ts
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   ├── usePagination.ts
│   └── useTheme.ts
├── services/
│   ├── supabase.ts        # Supabase client config
│   └── database.ts        # Main service layer (customers, transactions, branches, etc.)
├── utils/
│   ├── validation.ts
│   ├── formatting.ts
│   └── constants.ts
├── types/
│   └── index.ts           # TypeScript types
├── i18n/
│   ├── index.ts           # i18n config
│   └── locales/
│       ├── en.json
│       └── vi.json
└── contexts/
    ├── AuthContext.tsx
    └── TransactionTypeContext.tsx
```

### Naming Conventions
- **Components**: PascalCase (`CustomerCard.tsx`)
- **Utilities/Services**: camelCase (`validation.ts`)
- **Interfaces/Types**: PascalCase (`CustomerData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Files (components)**: PascalCase, **Files (utilities)**: camelCase

---

## Environment Setup

### Prerequisites
- Node.js 18+
- npm

### Install Dependencies
```bash
# Root level (installs workspace dependencies)
npm install

# Or for a specific app
cd apps/cashflow && npm install
```

### Development Scripts
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check

# Type check
npm run type-check

# Tests
npm run test
npm run test:watch
npm run test:coverage
npm run test:ci
```

### Environment Variables
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_APP_NAME=Cashflow Management System
```

---

## Development Tools

### ESLint
- TypeScript support (`@typescript-eslint`)
- React hooks rules (`eslint-plugin-react-hooks`)
- JSX runtime, accessibility (`eslint-plugin-jsx-a11y`)
- Import organization (`eslint-plugin-import`)
- Prettier integration (`eslint-plugin-prettier`)

### Prettier
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### TypeScript
- Strict mode enabled
- Path mapping: `@/` → `src/`
- Modern ECMAScript features

---

## Coding Standards

### General Principles
1. **Readability over cleverness** — Code is read more than written
2. **Consistency** — Follow existing patterns
3. **Self-documenting code** — Clear names; comments explain "why", not "what"
4. **Single responsibility** — Each function/component does one thing

### TypeScript
- **Never use `any`**. Define explicit types and interfaces.
- Use `interface` for object shapes, `type` for unions.

```typescript
// ✅ Good
interface Customer {
  id: string;
  name: string;
  email: string;
  current_balance: number;
}
function getCustomer(id: string): Promise<Customer | null> { ... }

// ❌ Bad
function getCustomer(id: any): any { ... }
```

### React
- Hooks at top level only (never conditional).
- Destructure props in parameters.
- Use named exports for components.

```typescript
// ✅ Good
const CustomerCard: React.FC<{ customer: Customer }> = ({ customer }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (...);
};

// ❌ Bad — conditional hooks
if (showData) { useState(null); }
```

### Import Order
```typescript
// 1. React and external libraries
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

// 2. Internal components
import { Button } from "@/components/UI";

// 3. Hooks and utilities
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/utils/formatting";

// 4. Types
import type { Customer } from "@/types";

// 5. Styles (if any)
import "./styles.css";
```

### Styling (TailwindCSS)
- **Class order**: layout → sizing → spacing → typography → colors → effects
- **Mobile-first**: `text-sm md:text-base lg:text-lg`
- **Never inline styles**: `style={{}}` is forbidden
- **No hardcoded colors**: Use Tailwind semantic colors (`bg-blue-600`, `text-gray-700`)

```tsx
// ✅ Good
<div className="flex flex-col w-full p-4 text-sm text-gray-700 bg-white rounded-lg shadow-md">

// ❌ Bad
<div style={{ marginTop: '16px', padding: '8px', backgroundColor: 'blue' }}>
```

### Service Layer
Return consistent `{ data, error }` response format:

```typescript
interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

async function getCustomer(id: string): Promise<ServiceResponse<Customer>> {
  try {
    const customer = await fetchCustomer(id);
    return { data: customer, error: null };
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}
```

### Comments & Documentation
- Explain **why**, not **what**.
- Use JSDoc for public utility functions.

```typescript
// ✅ Good — explains why
// Using slice(-30) to get last 30 days for performance
const recentData = allData.slice(-30);

// ❌ Bad — obvious
// Get the customer name
const name = customer.name;
```

### Code Review Checklist
- [ ] TypeScript has no errors (`npm run type-check`)
- [ ] All text uses i18n translation keys (no hardcoded strings)
- [ ] Components follow naming conventions
- [ ] No `console.log` left in code
- [ ] Error states handled
- [ ] Loading states handled
- [ ] Code formatted (`npm run format`)
- [ ] Relevant docs updated if architecture changed

---

## Internationalization (i18n)

### Supported Languages
- **English (en)** — default
- **Vietnamese (vi)**

### Setup
Dependencies: `i18next`, `react-i18next`, `i18next-browser-languagedetector`, `i18next-http-backend`

### Usage
```tsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  return <h1>{t('dashboard.title')}</h1>;
};
```

### Translation Structure
```json
{
  "dashboard": { "title": "Dashboard", "overview": "Overview" },
  "customers": { "title": "Customers", "addCustomer": "Add Customer" },
  "transactions": { "title": "Transactions", "addTransaction": "Add Transaction" },
  "common": { "loading": "Loading...", "error": "Error", "success": "Success" },
  "validation": { "required": "This field is required", "email": "Please enter a valid email" }
}
```

### Rules
- Always use translation keys — **never hardcode UI text**.
- Use hierarchical keys: `module.component.element`.
- Use interpolation for dynamic values: `t('validation.minLength', { min: 8 })`.

### Adding a New Language
1. Create `src/i18n/locales/[code].json`
2. Add to `LanguageSwitcher.tsx`
3. Register in `src/i18n/index.ts`

---

## Testing

### Testing Pyramid
```
    E2E Tests (Few)
        /\
       /  \
   Integration Tests (Some)
      /\
     /  \
Unit Tests (Many)
```

### Coverage Goals
- **Unit tests**: 90%+
- **Component tests**: 80%+
- **Integration tests**: 70%+
- **E2E tests**: Critical user paths

### Mocking Strategy
- **Supabase**: Mock auth, from/select/eq/single chains
- **i18next**: Mock `useTranslation` to return key as text
- **Browser APIs**: Mock `localStorage`, `matchMedia`, timers

### Running Tests
```bash
npm run test              # Unit tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
npm run test:ci           # CI mode (no watch)
```

---

## Git Workflow

### Pre-commit Checks
```bash
npm run type-check
npm run lint
npm run format:check
npm run test:ci
```

### Optional: Husky + lint-staged
```bash
npm install --save-dev husky lint-staged
npx husky add .husky/pre-commit "npx lint-staged"
```

### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```
