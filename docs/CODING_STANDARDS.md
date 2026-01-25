# Coding Standards & Best Practices

> **Purpose**: Ensure consistent, maintainable code across the team
> **Last Updated**: 2026-01-24

---

## 📋 General Principles

1. **Readability over cleverness** - Code is read more than written
2. **Consistency** - Follow existing patterns in the codebase
3. **Self-documenting code** - Use clear names, add comments for "why" not "what"
4. **Single responsibility** - Each function/component does one thing well

---

## 🔷 TypeScript Standards

### Type Definitions
```typescript
// ✅ Good - Explicit types
interface Customer {
  id: string;
  name: string;
  email: string;
  balance: number;
}

// ✅ Good - Type for function parameters
function getCustomer(id: string): Promise<Customer | null> {
  // ...
}

// ❌ Bad - Using 'any'
function getCustomer(id: any): any {
  // ...
}
```

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `customerName` |
| Functions | camelCase | `getCustomerById` |
| Components | PascalCase | `CustomerCard` |
| Interfaces | PascalCase | `CustomerData` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Files (components) | PascalCase | `CustomerCard.tsx` |
| Files (utilities) | camelCase | `formatting.ts` |

### Imports Order
```typescript
// 1. React and external libraries
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

// 2. Internal components
import { Button } from "../../components/UI/Button";
import { CustomerCard } from "./CustomerCard";

// 3. Hooks and utilities
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../utils/formatting";

// 4. Types
import type { Customer } from "../../types";

// 5. Styles (if any)
import "./styles.css";
```

---

## ⚛️ React Standards

### Component Structure
```typescript
// CustomerCard.tsx
import React from "react";
import { useTranslation } from "react-i18next";

// Types at the top
interface CustomerCardProps {
  customer: Customer;
  onSelect?: (id: string) => void;
}

// Named export preferred
export const CustomerCard: React.FC<CustomerCardProps> = ({ 
  customer, 
  onSelect 
}) => {
  const { t } = useTranslation();
  
  // Hooks first
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Event handlers
  const handleClick = () => {
    onSelect?.(customer.id);
  };
  
  // Render
  return (
    <div className="customer-card" onClick={handleClick}>
      <h3>{customer.name}</h3>
      <p>{t("customer.balance")}: {formatCurrency(customer.balance)}</p>
    </div>
  );
};
```

### Hooks Rules
```typescript
// ✅ Good - Hooks at top level
const MyComponent = () => {
  const [data, setData] = useState(null);
  const { t } = useTranslation();
  
  useEffect(() => {
    // effect logic
  }, []);
  
  return <div>{/* ... */}</div>;
};

// ❌ Bad - Conditional hooks
const MyComponent = ({ showData }) => {
  if (showData) {
    const [data, setData] = useState(null); // Never do this!
  }
  return <div>{/* ... */}</div>;
};
```

### Props Destructuring
```typescript
// ✅ Good - Destructure in parameters
const Button = ({ label, onClick, disabled = false }) => {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
};

// ❌ Avoid - Props object access
const Button = (props) => {
  return <button onClick={props.onClick}>{props.label}</button>;
};
```

---

## 🌐 Internationalization (i18n)

### Always Use Translation Keys
```typescript
// ✅ Good
<h1>{t("dashboard.title")}</h1>
<p>{t("dashboard.description")}</p>

// ❌ Bad - Hardcoded text
<h1>Dashboard</h1>
<p>Welcome to the dashboard</p>
```

### Translation Key Naming
```json
{
  "module": {
    "component": {
      "element": "Translation text"
    }
  }
}

// Example
{
  "dashboard": {
    "cashFlowChart": {
      "title": "Cash Flow Chart",
      "subtitle30Days": "Last 30 days"
    }
  }
}
```

### Dynamic Values
```typescript
// Use interpolation
t("customer.greeting", { name: customer.name })

// translation.json
{
  "customer": {
    "greeting": "Hello, {{name}}!"
  }
}
```

---

## 🎨 Styling with TailwindCSS

### Class Organization
```tsx
// Order: layout → sizing → spacing → typography → colors → effects
<div className="flex flex-col w-full p-4 text-sm text-gray-700 bg-white rounded-lg shadow-md">
```

### Responsive Design
```tsx
// Mobile-first approach
<div className="text-sm md:text-base lg:text-lg">
  {/* Small screens first, then larger */}
</div>
```

### Avoid Inline Styles
```tsx
// ✅ Good - Tailwind classes
<div className="mt-4 p-2 bg-blue-500 text-white">

// ❌ Avoid - Inline styles
<div style={{ marginTop: '16px', padding: '8px', backgroundColor: 'blue' }}>
```

---

## 📁 File Organization

### Component Files
```
components/
├── UI/
│   ├── Button.tsx
│   ├── Input.tsx
│   └── index.ts          # Re-exports
├── Layout/
│   ├── Header.tsx
│   └── Sidebar.tsx
└── index.ts              # Main re-exports
```

### Page Structure
```
pages/
├── Dashboard/
│   ├── Dashboard.tsx     # Main page component
│   ├── components/       # Page-specific components
│   │   ├── CashFlowChart.tsx
│   │   ├── MetricsCard.tsx
│   │   └── index.ts
│   └── index.ts          # Re-export
```

### Index Files for Clean Imports
```typescript
// components/UI/index.ts
export { Button } from "./Button";
export { Input } from "./Input";
export { Card } from "./Card";

// Usage
import { Button, Input, Card } from "../../components/UI";
```

---

## 🔧 Service Layer

### Service Structure
```typescript
// services/database.ts

// Define individual services first
const customerService = {
  async getCustomers(filters?: CustomerFilters) {
    // Implementation
  },
  async getCustomerById(id: string) {
    // Implementation
  },
};

// Export combined service object at the end
export const databaseService = {
  customers: customerService,
  transactions: transactionService,
  // ...
};
```

### Error Handling
```typescript
// Return consistent response format
interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

async function getCustomer(id: string): Promise<ServiceResponse<Customer>> {
  try {
    const customer = await fetchCustomer(id);
    return { data: customer, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}
```

---

## 📝 Comments & Documentation

### When to Comment
```typescript
// ✅ Good - Explain "why"
// Using slice(-30) to get last 30 days for performance
const recentData = allData.slice(-30);

// ✅ Good - Complex business logic
// Calculate week number using ISO week date system
// Week 1 is the week containing the first Thursday of the year
const weekNumber = Math.ceil((dayOfYear + startDay) / 7);

// ❌ Bad - Obvious comments
// Get the customer name
const name = customer.name;
```

### JSDoc for Public Functions
```typescript
/**
 * Formats a number as Vietnamese currency (VND)
 * @param amount - The amount to format
 * @param showSymbol - Whether to show the ₫ symbol (default: true)
 * @returns Formatted currency string
 * @example
 * formatCurrency(1000000) // "1,000,000 ₫"
 */
export function formatCurrency(amount: number, showSymbol = true): string {
  // Implementation
}
```

---

## ✅ Code Review Checklist

Before submitting code:
- [ ] TypeScript has no errors (`npm run typecheck`)
- [ ] All text uses i18n translation keys
- [ ] Components follow naming conventions
- [ ] No console.log statements left in code
- [ ] Error states are handled
- [ ] Loading states are handled
- [ ] Code is formatted (`npm run format`)
- [ ] AI_CONTEXT.md is updated if architecture changed
