# ARCHITECTURE — Inventory Operation System

> **Merged from:** vault/ARCHITECTURE.md, vault/CODEBASE_OPTIMIZATION.md  
> **Last Updated:** 2026-05-04

---

## System Overview

Inventory Operation System là ứng dụng web quản lý xuất nhập tồn cho F&B, kiến trúc client-side rendering với Supabase backend.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                              │
│  React 18 + TypeScript + Tailwind CSS + Vite 8             │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐     │
│  │   Pages     │  │  Components  │  │    Hooks       │     │
│  │  (lazy-load)│  │  (UI/Layout) │  │ (data/state)   │     │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘     │
│         └────────────────┼──────────────────┘              │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Service Layer                            │   │
│  │  databaseService.ts — Business Logic & Validation    │   │
│  │  inventoryVarianceService.ts — Variance Reports      │   │
│  │  fallbackService.ts — Trial mode fallback            │   │
│  │  excelImportService.ts — Excel/CSV parsing           │   │
│  │  columnConfigService.ts — Column settings            │   │
│  └──────────────────────┬───────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                Supabase Client Layer                         │
│  - Authentication (@superapp/iam → AuthProvider)            │
│  - Database Client (@supabase/supabase-js)                  │
│  - Real-time Subscriptions (optional)                       │
│  - InsForge apiClient (from() / rpc() proxy)                │
└────────────────────┬────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Backend (PostgreSQL)                   │
│  - Database Tables (RLS Protected)                           │
│  - Stored Functions (has_app_access, update_updated_at)     │
│  - Triggers (inventory→cashflow, updated_at)                │
│  - Generated Columns (variance, total_value)                │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Component Architecture

### Folder Layout

```
apps/inventory-operation/
├── src/
│   ├── components/
│   │   ├── UI/                    # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── LoadingFallback.tsx
│   │   │   ├── ErrorFallback.tsx
│   │   │   └── AddButton.tsx
│   │   ├── Layout/                # Layout components
│   │   │   ├── Layout.tsx         # Main layout shell
│   │   │   ├── Navigation.tsx     # Top nav bar
│   │   │   ├── Sidebar.tsx        # Side nav (role-filtered)
│   │   │   ├── BottomTabBar.tsx   # Mobile bottom tabs
│   │   │   └── AppSwitcher.tsx    # Cross-app switcher
│   │   ├── auth/                  # Auth components
│   │   │   └── ProtectedRoute.tsx
│   │   ├── Help/                  # Onboarding & help
│   │   │   ├── OnboardingTour.tsx
│   │   │   └── ContextHelp.tsx
│   │   ├── Dashboard/             # Dashboard widgets
│   │   │   ├── FeaturedProducts.tsx
│   │   │   └── InventoryWaterfallChart.tsx
│   │   ├── ImportExport/          # Import/export components
│   │   │   └── ImportExportPage.tsx
│   │   ├── ProductCatalogTable.tsx
│   │   ├── ProductCatalogForm.tsx
│   │   ├── InventoryMovementLedger.tsx
│   │   ├── InventoryMetricsCard.tsx
│   │   ├── InventoryTimeRangeSelector.tsx
│   │   ├── QuickAddMenu.tsx
│   │   └── ErrorBoundary.tsx
│   ├── pages/                     # Page components (lazy-loaded)
│   │   ├── Auth/                  # Login, SignUp
│   │   ├── CompanySelector/       # Multi-company selector
│   │   ├── DashboardPageEnhanced.tsx
│   │   ├── ProductCatalogPageEnhanced.tsx
│   │   ├── InventoryRecordsPage.tsx
│   │   ├── InventoryInputPage.tsx
│   │   ├── GoodsReceiptPage.tsx
│   │   ├── PurchaseOrderPage.tsx
│   │   ├── SupplierManagement.tsx
│   │   ├── SupplierReturnPage.tsx
│   │   ├── InventoryMRPPage.tsx
│   │   ├── SpecialOutboundPage.tsx
│   │   ├── InventoryVarianceReportPage.tsx
│   │   ├── InventoryExportPage.tsx
│   │   ├── ProductBulkImportComplete.tsx
│   │   ├── ImportSettingsPage.tsx
│   │   ├── ProductCatalogSettingsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── HelpPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── ... (demo pages, import pages)
│   ├── services/                  # Business logic & API calls
│   │   ├── databaseService.ts     # Main service layer
│   │   ├── inventoryVarianceService.ts
│   │   ├── fallbackService.ts     # Trial mode fallback
│   │   ├── excelImportService.ts
│   │   ├── googleSheetsService.ts
│   │   └── columnConfigService.ts
│   ├── hooks/                     # Custom React hooks
│   │   ├── useProducts.ts
│   │   ├── useInventory.ts
│   │   ├── useSales.ts (useSalesReport)
│   │   ├── useProductCatalog.ts
│   │   ├── useInventoryVariance.ts
│   │   └── useAuth.ts (via @superapp/iam)
│   ├── types/                     # TypeScript type definitions
│   │   ├── Product.ts
│   │   ├── InventoryRecord.ts
│   │   ├── InventoryMovement.ts
│   │   ├── UserRole.ts
│   │   ├── index.ts
│   │   └── database.types.ts
│   ├── utils/                     # Utility functions
│   │   ├── rbac.ts                # Role-based access control
│   │   ├── formatting.ts          # Number/date formatting
│   │   ├── conversionLogic.ts     # Unit conversion engine
│   │   ├── validation.ts          # Validation utilities
│   │   └── importUtils.ts         # Import utilities
│   ├── lib/                       # External library configs
│   │   └── supabase.ts            # Supabase client init
│   ├── data/                      # Mock/trial data
│   │   ├── trialMockData.ts
│   │   └── realProductsData.ts
│   └── App.tsx                    # Main app with routing
├── docs/                          # Documentation (this folder)
├── public/                        # Static assets
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

### Code Splitting Strategy

Tất cả pages được **lazy-loaded** qua `React.lazy()` + `Suspense`:

```typescript
const DashboardPageEnhanced = lazy(() => import('./pages/DashboardPageEnhanced'));
const ProductCatalogPageEnhanced = lazy(() => import('./pages/ProductCatalogPageEnhanced'));
// ... 30+ lazy-loaded pages
```

Loading fallback: spinner emerald-600.

### Routing Architecture

```typescript
<AuthProvider>
  <CompanyProvider>
    <Router>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Protected, no layout */}
          <Route path="/company-selector" element={<ProtectedRoute>...} />

          {/* Protected with Layout */}
          <Route path="/" element={<ProtectedRoute><Layout/>...</ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<DashboardPageEnhanced />} />
            <Route path="product-management" element={<ProductCatalogPageEnhanced />} />
            {/* ... 20+ routes */}
            {/* Legacy redirects */}
            <Route path="inventory-input" element={<Navigate to="/inventory-records?tab=entry" />} />
            <Route path="variance-report" element={<Navigate to="/dashboard?tab=variance" />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  </CompanyProvider>
</AuthProvider>
```

### Layout Architecture

```
┌─────────────────────────────────────────┐
│           Navigation (top bar)           │  ← sticky, h-16
├──────────┬──────────────────────────────┤
│          │                              │
│  Sidebar │       Main Content           │  ← Outlet
│  (left)  │       (p-4 sm:p-5 lg:p-6)   │
│  w-72    │                              │
│  xl:w-80 │                              │
│          │                              │
├──────────┴──────────────────────────────┤
│         BottomTabBar (mobile)            │  ← lg:hidden
└─────────────────────────────────────────┘
```

- **Desktop:** Sidebar sticky bên trái, content bên phải
- **Mobile:** Sidebar overlay (translate-x), bottom tab bar
- **Dark mode:** Toggle qua `localStorage.theme`, `prefers-color-scheme`

## Security Architecture

### Authentication Flow

```
1. User enters credentials → Login.tsx
2. Supabase Auth validates → JWT issued
3. @superapp/iam AuthProvider stores session
4. CompanyProvider loads user's companies
5. ProtectedRoute checks auth + app_permissions
6. RLS policies enforce access at DB level
7. Sidebar filters navigation by role
```

### Row-Level Security (RLS)

**Policy Pattern (avoid infinite recursion):**
```sql
-- User sees their branch's data
CREATE POLICY "Users can view their branch data" ON table_name
    FOR SELECT USING (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM users WHERE id = auth.uid()))
        )
    );
```

**Critical:** Không dùng `USING (true)` — gây infinite recursion (bài học từ cashflow).

### RBAC Structure

```typescript
interface StaffPermissions {
  import_products: boolean;
  import_inventory: boolean;
  view_reports: boolean;
  manage_settings: boolean;
}

// App-level gating
app_permissions: { cashflow: boolean, inventory: boolean }
```

## Cross-App Integration

```
Inventory Operation                    Cashflow App
     │                                     │
     ├── inventory_records ──trigger──→ transactions (charge)
     │   (supplier_id, total_amount)       (auto công nợ NCC)
     │
     ├── sales_records ────trigger──→ transactions (charge)
     │   (customer_id, total_amount)       (auto công nợ KH)
     │
     └── Shared: users, companies, branches, customers
         (partner_type: customer|supplier|both)
```

## Key Technical Decisions (ADRs)

| ADR | Decision | Rationale |
|-----|----------|-----------|
| 001 | Supabase as backend | PostgreSQL + Auth + Realtime, shared project |
| 002 | TypeScript strict mode | Catch errors at compile time |
| 003 | Server-side validation | Data integrity, never trust client |
| 004 | RLS on all tables | Database-level security |
| 005 | Bulk limit 200 rows | Prevent performance issues |
| 006 | RBAC granular permissions | Fine-grained access control |
| 007 | Product code uniqueness | `businessCode` unique per company |
| 008 | Inventory composite key | `(company_id, branch_id, date, product_id)` |
| 009 | CSV-only import/export | UTF-8, predictable parsing |
| 010 | React + Vite frontend | Fast HMR, modern tooling |

## Performance Considerations

- **Code splitting:** Lazy-loaded pages reduce initial bundle
- **Memoization:** `useMemo` for product maps, filtered lists
- **O(1) lookups:** Product lookup via `Map` keyed by `id` and `businessCode`
- **Indexing:** DB indexes on company_id, branch_id, date, product_id
- **Generated columns:** variance, total_value computed at DB level

## Anti-Patterns to Avoid

1. **Dual data sources** — Use global cache only for display, local state for filters
2. **Hardcoded fallbacks** — Show error, don't silently use default data
3. **Client-side only validation** — Always validate server-side
4. **Mass UPDATE without WHERE** — Always include `.match()` or `.eq()`
5. **Stale cache after mutation** — Invalidate and reload after writes

---

*Tài liệu tổng hợp từ vault/ARCHITECTURE.md và vault/CODEBASE_OPTIMIZATION.md.*
