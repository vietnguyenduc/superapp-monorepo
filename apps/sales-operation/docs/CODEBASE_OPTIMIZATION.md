# Codebase Optimization Guide — Inventory Operation System

> **Phase 7: Apply Cashflow Lessons, Code Quality, Performance & Security**
> **Last Updated:** 2026-05-03

---

## 7.1 Apply Cashflow Lessons Learned

### 7.1.1 Remove Hardcoded Fallbacks

**Problem:** Cashflow app had `baseTypes` hardcoded in `database.ts` as fallback when DB query fails. This masked database issues and caused inconsistent UI behavior.

**Inventory Action Items:**
- [ ] Audit `src/services/databaseService.ts` — search for any hardcoded product types, categories, units, or default values
- [ ] Remove all hardcoded fallbacks for reference data
- [ ] If database query fails, show error to user and log to monitoring — do NOT silently use fallback

**Verification:**
```bash
# Search for hardcoded fallbacks
grep -rn "fallback\|default.*=\|baseTypes\|hardcode" src/services/
```

---

### 7.1.2 Single Source of Truth for Display Logic

**Problem:** Cashflow had dual data sources — global cache (`cachedTransactionTypes`) AND component state (`transactionTypes`) — both used for display. Race condition caused data to flicker between correct and incorrect values.

**Inventory Action Items:**
- [ ] Audit all components using product/inventory data for display
- [ ] Ensure display logic uses ONLY global cache (preloaded at app init)
- [ ] Component local state may ONLY be used for filter dropdowns / select inputs
- [ ] Remove any second parameter from display helper functions (e.g., `getProductName(id, localCache)` ? `getProductName(id)`)

**Pattern:**
```typescript
// ? WRONG — dual sources
const displayName = getProductName(id, localProducts) || getProductName(id, globalCache);

// ? CORRECT — single source
displayName = getProductNameFromCache(id);  // always uses global cache
```

---

### 7.1.3 Preload Global Cache Before Component Render

**Problem:** Components rendered before cache was ready, showing empty/loading states or wrong data briefly.

**Inventory Action Items:**
- [ ] Add cache preload step in app initialization (before router renders pages)
- [ ] Show global loading spinner until all critical caches are loaded:
  - Products catalog
  - Inventory records (current month)
  - Sales records (current month)
  - User permissions
- [ ] Use React Suspense / `isLoading` flag at App level

**Implementation Sketch:**
```typescript
// src/App.tsx or src/main.tsx
async function preloadCaches() {
  await Promise.all([
    productCache.load(),
    inventoryCache.loadCurrentMonth(),
    salesCache.loadCurrentMonth(),
    authCache.loadUser(),
  ]);
}
```

---

### 7.1.4 NO Mass Updates Without WHERE Clause

**Problem:** Cashflow critical bug — `UPDATE transactions SET customer_id = 'xxx'` without WHERE updated ALL 10,000+ records. Required emergency rollback.

**Inventory Action Items:**
- [ ] Audit all UPDATE statements in service layer — verify WHERE clause exists
- [ ] Create helper function `safeUpdate(table, values, conditions)` that REQUIRES conditions
- [ ] Ban raw `update().set()` without `.match()` or `.eq()`
- [ ] For bulk updates, require explicit confirmation dialog showing count of affected rows

**Rule:**
```typescript
// ? FORBIDDEN
await supabase.from('inventory_records').update({ status: 'archived' });

// ? REQUIRED
await supabase.from('inventory_records')
  .update({ status: 'archived' })
  .match({ company_id: currentCompanyId, date_lt: cutoffDate });
```

---

### 7.1.5 Verify Database Schema Before Changes

**Problem:** Agent assumed `customer_id` field existed in form and database, leading to data integrity violation.

**Inventory Action Items:**
- [ ] Before ANY code change touching database:
  1. Read schema via MCP Supabase tools or `\d table_name` in SQL Editor
  2. Verify ALL required fields exist
  3. Verify foreign key relationships
  4. Document findings in session notes
- [ ] Use TypeScript database types (`src/types/database.types.ts`) as source of truth
- [ ] If type definition differs from actual schema, fix types FIRST before code changes

---

### 7.1.6 Always Include ALL Database Fields in Forms

**Problem:** Transaction edit form was missing `customer_id`, causing it to be omitted from UPDATE payload and leaving stale data.

**Inventory Action Items:**
- [ ] For every form, create checklist mapping form fields ? database columns
- [ ] Verify every nullable field has explicit handling (not just omitted)
- [ ] Use TypeScript `Required<Partial<TableType>>` pattern for form state types
- [ ] On edit form initialization, load full record from database (not just displayed fields)

---

### 7.1.7 Never Hardcode Foreign Key Values

**Problem:** Agent arbitrarily assigned `customer_id = '22dab687...'` to ALL transactions.

**Inventory Action Items:**
- [ ] All foreign key fields must use dropdown/select with live data from referenced table
- [ ] Validate referenced record exists before insert/update
- [ ] Handle NULL explicitly for optional foreign keys
- [ ] For required foreign keys, form should be invalid until user selects value

---

## 7.2 Code Quality

### 7.2.1 Configure ESLint

**Base Config (copy from cashflow + inventory-specific rules):**

```javascript
// .eslintrc.cjs
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/jsx-runtime',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['error', 'warn'] }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
};
```

**Action Items:**
- [ ] Install dev dependencies: `npm i -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react-hooks`
- [ ] Add lint script to `package.json`: `"lint": "eslint src --ext .ts,.tsx"`
- [ ] Run `npm run lint` — fix all errors before committing

---

### 7.2.2 Configure Prettier

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

**Action Items:**
- [ ] Install: `npm i -D prettier`
- [ ] Add format script: `"format": "prettier --write \"src/**/*.{ts,tsx,css,json}\""`
- [ ] Run format on entire codebase once

---

### 7.2.3 Enable TypeScript Strict Mode

**Current Status:** Partial — some files use `any`, `tsconfig.json` may not have `strict: true`.

**Action Items:**
- [ ] Set `strict: true` in `tsconfig.json`
- [ ] Fix `noImplicitAny` violations in `src/services/databaseService.ts`
- [ ] Fix `strictNullChecks` violations in form handlers
- [ ] Add `database.types.ts` to `include` array if not already
- [ ] Target: zero `any` types in new code; gradual refactor for legacy

---

### 7.2.4 Add Pre-Commit Hooks

```bash
npm i -D husky lint-staged
npx husky init
```

`.husky/pre-commit`:
```bash
npx lint-staged
```

`package.json`:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

**Action Items:**
- [ ] Install husky + lint-staged
- [ ] Configure pre-commit hook
- [ ] Test by making a small change and committing

---

### 7.2.5 Remove console.log Statements

**Action Items:**
- [ ] Run: `grep -rn "console.log" src/ --include="*.ts" --include="*.tsx"`
- [ ] Replace with structured logging utility:

```typescript
// src/utils/logger.ts
export const logger = {
  debug: import.meta.env.DEV ? console.log : () => {},
  info: (msg: string, meta?: Record<string, unknown>) => {
    // Send to monitoring service in production
    console.info(`[INFO] ${msg}`, meta);
  },
  error: (msg: string, error?: Error) => {
    // Send to Sentry / monitoring
    console.error(`[ERROR] ${msg}`, error);
  },
};
```

---

### 7.2.6 Add Code Coverage Reporting

**Action Items:**
- [ ] Install Vitest + coverage: `npm i -D vitest @vitest/coverage-v8`
- [ ] Add test script: `"test": "vitest --coverage"`
- [ ] Target coverage thresholds (Phase 8):
  - Branches: 70%
  - Functions: 75%
  - Lines: 80%

---

## 7.3 Performance Optimization

### 7.3.1 Implement Proper Caching Strategies

| Cache Type | Scope | Invalidation Trigger |
|-----------|-------|---------------------|
| Product Catalog | Global (App) | After product CRUD, bulk import |
| Inventory Records | Branch + Month | After daily entry, import |
| Sales Records | Branch + Month | After sales entry, import |
| User Permissions | Session | After login, role change |
| Company/Branches | Global | After settings update |

**Action Items:**
- [ ] Create `src/utils/cache.ts` with TTL-based cache
- [ ] Implement `useCachedQuery` hook for React Query-style caching
- [ ] Add cache invalidation helpers tied to mutation operations

---

### 7.3.2 Add Loading States

**Action Items:**
- [ ] Audit all async operations in pages — verify loading state exists
- [ ] Standardize loading component: `src/components/UI/LoadingSpinner.tsx`
- [ ] Add skeleton screens for data-heavy pages (Dashboard, Product Catalog)
- [ ] Disable form submit buttons while mutation in progress

---

### 7.3.3 Optimize Database Queries

**Action Items:**
- [ ] Add missing indexes (verify in migrations):
  ```sql
  CREATE INDEX idx_inventory_records_date_branch ON inventory_records(date, branch_id);
  CREATE INDEX idx_inventory_records_product ON inventory_records(productCode);
  CREATE INDEX idx_sales_records_date ON sales_records(date);
  ```
- [ ] Use `select()` with explicit columns instead of `select('*')`
- [ ] Implement pagination for large lists (>50 items)
- [ ] Use `range()` for offset/limit queries

---

### 7.3.4 Add Pagination for Large Datasets

**Pattern:**
```typescript
const PAGE_SIZE = 50;

async function getProductsPage(page: number) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  return supabase.from('products')
    .select('*', { count: 'exact' })
    .eq('company_id', companyId)
    .range(from, to);
}
```

**Action Items:**
- [ ] Add pagination to Product Catalog page
- [ ] Add pagination to Inventory Records history
- [ ] Add pagination to Sales Records report

---

### 7.3.5 Implement Lazy Loading

**Action Items:**
- [ ] Use `React.lazy()` for route-level code splitting:
  ```typescript
  const InventoryImportPage = lazy(() => import('./pages/InventoryImport'));
  ```
- [ ] Add `Suspense` boundary with loading spinner in router
- [ ] Lazy-load heavy chart/report libraries

---

### 7.3.6 Add Performance Monitoring

**Action Items:**
- [ ] Add `web-vitals` library for Core Web Vitals tracking
- [ ] Log slow queries (>500ms) to monitoring
- [ ] Add bundle size analyzer: `npm i -D @vitejs/plugin-analyzer`
- [ ] Target bundle size: <200KB initial load

---

## 7.4 Security Hardening

### 7.4.1 Review All RLS Policies

**Audit Checklist:**
- [ ] List all policies: `\dRp` in psql or Dashboard ? Database ? Policies
- [ ] Verify NO policy uses `USING (true)` or `WITH CHECK (true)`
- [ ] Verify all policies include company_id / branch_id filter where applicable
- [ ] Verify `users` table policy uses `auth.uid()::uuid = id` (NOT recursive subquery)
- [ ] Test policy with different roles (admin, staff, anonymous)

**Critical Tables to Audit:**
| Table | Must Filter By | Policy Status |
|-------|---------------|---------------|
| `products` | `company_id` | ? Audit |
| `inventory_records` | `branch_id` | ? Audit |
| `sales_records` | `branch_id` | ? Audit |
| `users` | `auth.uid()::uuid = id` | ? Audit |

---

### 7.4.2 Ensure No `USING true` Policies

**Fix Pattern:**
```sql
-- ? DANGEROUS — causes infinite recursion
CREATE POLICY products_policy ON products
FOR ALL TO authenticated USING (true);

-- ? SAFE — direct comparison
CREATE POLICY products_select ON products
FOR SELECT TO authenticated
USING (company_id = current_setting('app.current_company')::uuid);
```

---

### 7.4.3 Add Rate Limiting

**Frontend (lightweight):**
- [ ] Debounce rapid API calls (search inputs, auto-save)
- [ ] Limit bulk import frequency (e.g., max 1 import per 30 seconds)

**Backend (Supabase Edge Functions — future):**
- Implement Edge Function middleware for rate limiting by IP + user

---

### 7.4.4 Implement CSRF Protection

**Action Items:**
- [ ] Supabase client handles JWT-based auth (no cookie session vulnerability)
- [ ] Verify no state-changing operations accept GET requests
- [ ] Add custom headers to all fetch requests (`X-Requested-With: XMLHttpRequest`)

---

### 7.4.5 Sanitize All User Inputs

**Action Items:**
- [ ] Audit all `dangerouslySetInnerHTML` usage — remove if unnecessary
- [ ] Sanitize imported CSV data (strip HTML tags from text fields)
- [ ] Validate file types strictly (accept only `.csv`, reject by MIME AND extension)
- [ ] Escape display of user-generated content (product names, descriptions)

---

### 7.4.6 Add Security Headers

**Vercel `vercel.json`:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

**Action Items:**
- [ ] Create `apps/inventory-operation/vercel.json`
- [ ] Test headers in browser DevTools Network tab

---

## Verification Checklist

Before marking Phase 7 complete:

- [ ] ESLint passes with zero errors (`npm run lint`)
- [ ] Prettier formats all files (`npm run format`)
- [ ] TypeScript strict mode compiles (`npx tsc --noEmit`)
- [ ] Pre-commit hook runs successfully
- [ ] Zero `console.log` in production build (except logger utility)
- [ ] RLS policy audit completed with written results
- [ ] Security headers verified in Vercel preview deployment
- [ ] Bundle size <200KB (measured with analyzer)
- [ ] Core Web Vitals: LCP <2.5s, CLS <0.1

---

## References

- Cashflow Anti-Patterns: `apps/cashflow/docs/DATA_FLOW_MAP.md`
- Cashflow Critical Bug Log: `memory/210bb746-1c65-4b5b-a954-8d53d9bed363`
- RLS Infinite Recursion Fix: `memory/70c4502c-aecb-4a92-be11-9c75de7637e1`