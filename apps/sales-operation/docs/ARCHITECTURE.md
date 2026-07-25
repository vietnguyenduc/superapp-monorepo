# Architecture — Sales Operation App

> Kiến trúc kỹ thuật, tech stack, cấu trúc thư mục và component.

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build tool | Vite 8 |
| Styling | Tailwind CSS 3 (Apple-inspired design) |
| Routing | react-router-dom 6 |
| State | React Hooks + Custom hooks |
| Backend | Supabase (PostgreSQL + Realtime) |
| Auth | `@superapp/iam` (AuthProvider, CompanyProvider) |
| Charts | Recharts 3 |
| Icons | @heroicons/react 2 |
| i18n | i18next + react-i18next |
| Drag & drop | react-beautiful-dnd |
| File upload | react-dropzone |
| Excel | xlsx (SheetJS) |
| E-invoice | @superapp/einvoice |
| Shared utils | @superapp/shared-utils |
| Shared types | @repo/types |
| Shared UI | @repo/ui |
| Testing | Vitest + Testing Library + jsdom |
| Lint/Format | ESLint + Prettier |
| Deployment | Vercel (production: sales.appforyou.xyz) |

## Cấu trúc thư mục

```
apps/sales-operation/
├── src/
│   ├── App.tsx                    # Root: Router, AuthProvider, CompanyProvider
│   ├── FixedApp.tsx               # Alternative root (debug)
│   ├── pages/                     # Các trang chính
│   │   ├── Auth/
│   │   │   ├── Login.tsx
│   │   │   └── SignUp.tsx
│   │   ├── CompanySelector/
│   │   │   └── CompanySelector.tsx
│   │   ├── DashboardPageEnhanced.tsx      # Dashboard bán hàng
│   │   ├── SalesOrdersPage.tsx            # Danh sách đơn hàng
│   │   ├── SalesOrderCreatePage.tsx       # Tạo đơn (POS + bulk)
│   │   ├── CustomerManagementPage.tsx     # Quản lý khách hàng
│   │   ├── InvoiceManagementPage.tsx      # Hóa đơn điện tử
│   │   ├── SalesReportPage.tsx            # Báo cáo bán hàng (Bảng 3)
│   │   ├── SpecialOutboundPage.tsx        # Xuất đặc biệt (Bảng 3.1)
│   │   ├── InventoryReportPage.tsx        # Báo cáo nhập xuất tồn (Bảng 4)
│   │   ├── StockCheckPrintPage.tsx        # Phiếu kiểm kho (Bảng 5)
│   │   ├── ProductCatalogPage.tsx         # Danh mục hàng hóa (Bảng 2)
│   │   ├── InventoryInputPage.tsx         # Nhập liệu tồn kho (Bảng 1)
│   │   ├── SettingsPage.tsx               # Cài đặt
│   │   ├── ProfilePage.tsx / Profile/
│   │   ├── HelpPage.tsx                   # Hướng dẫn
│   │   └── ... (demo, import, test pages)
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Layout.tsx          # Shell: Navigation + Sidebar + Outlet + BottomTabBar
│   │   │   ├── Navigation.tsx      # Top bar
│   │   │   ├── Sidebar.tsx         # Desktop sidebar (role-filtered)
│   │   │   └── BottomTabBar.tsx    # Mobile bottom nav
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx  # Route guard
│   │   ├── UI/                     # Button, Card, PageHeader, SearchBar, AddButton...
│   │   ├── ImportExport/           # EditableDataGrid, ClipboardPasteInput
│   │   ├── Invoice/                # IssueInvoiceSlideOver, InvoicePreviewModal
│   │   ├── Help/                   # OnboardingTour, ContextHelp
│   │   ├── SpecialOutboundForm.tsx
│   │   ├── SpecialOutboundTable.tsx
│   │   ├── QuickAddMenu.tsx
│   │   └── ErrorBoundary.tsx
│   ├── hooks/
│   │   ├── useSales.ts             # useSalesReport, useSpecialOutbound
│   │   ├── useProductCatalog.ts
│   │   ├── usePermissions.ts
│   │   └── useAuth.test.ts
│   ├── services/
│   │   ├── salesService.ts         # CRUD sales_records
│   │   ├── specialOutboundService.ts # CRUD + approve/reject + approval_logs
│   │   ├── fallbackService.ts      # Trial/mock mode
│   │   ├── baseService.ts          # BaseService.execute (supabase + fallback)
│   │   ├── authService.ts
│   │   └── ... (column settings, export templates, variance reporting)
│   ├── utils/
│   │   ├── rbac.ts                 # Role definitions & helpers
│   │   ├── permissions.ts          # Granular permission checks
│   │   └── ... (conversion, formatting, import/export)
│   ├── types/
│   │   ├── index.ts                # Re-export tất cả types
│   │   ├── UserRole.ts             # UserRole enum, Permission enum, ROLE_PERMISSIONS
│   │   ├── SalesRecord.ts          # SalesRecord, SpecialOutboundRecord, enums
│   │   ├── ApprovalLog.ts          # ApprovalLog, ApprovalWorkflow, ApprovalStep
│   │   ├── Product.ts
│   │   ├── InventoryRecord.ts
│   │   ├── InventoryReport.ts
│   │   ├── import.ts
│   │   └── database.types.ts       # Supabase generated types
│   ├── lib/
│   │   └── supabase.ts             # Supabase client, getCurrentUserId, apiClient
│   └── styles/
├── package.json
├── vite.config.ts                  # port: 5176
├── tailwind.config.js
├── tsconfig.json
├── README.md
├── SUPABASE-SETUP.md
└── docs/                           # Tài liệu này
```

## Kiến trúc ứng dụng

### Routing & Auth Flow

```
App.tsx
  └── ErrorBoundary
       └── AuthProvider (@superapp/iam)
            └── CompanyProvider
                 └── Router (BrowserRouter)
                      ├── /login          (public)
                      ├── /signup         (public)
                      ├── /company-selector (ProtectedRoute, no layout)
                      └── /               (ProtectedRoute + Layout)
                           ├── index → redirect /dashboard
                           ├── /dashboard
                           ├── /sales-orders
                           ├── /sales-order-create
                           ├── /customers
                           ├── /invoices
                           ├── /settings
                           ├── /profile
                           └── /help
```

### Layout Shell

```
Layout.tsx
  ├── Navigation (top bar — menu toggle, user info)
  ├── Sidebar (desktop, sticky, role-filtered menu)
  ├── Sidebar (mobile, slide-over)
  ├── <Outlet /> (page content)
  ├── QuickAddMenu (floating add button)
  └── BottomTabBar (mobile only — 5 tabs)
```

### Data Layer Pattern

```
Page component
  └── Custom hook (useSalesReport / useSpecialOutbound)
       └── Service class (salesService / specialOutboundService)
            └── BaseService.execute(supabaseQuery, fallbackFn)
                 ├── Supabase client (production)
                 └── fallbackService (trial/mock mode via localStorage)
```

`BaseService.execute` là pattern cốt lõi: thử Supabase trước, nếu lỗi hoặc ở trial mode thì dùng fallback (mock data trong localStorage). Điều này cho phép app chạy mà không cần backend.

### Multi-tenant

- `AuthProvider` + `CompanyProvider` từ `@superapp/iam` cung cấp context công ty.
- Mọi bảng có `company_id` để phân tách dữ liệu theo công ty.
- `ProtectedRoute` đảm bảo chỉ user đã đăng nhập mới truy cập được.

### Theme

- Dark mode qua `localStorage.getItem('theme')` + `prefers-color-scheme`.
- Class `dark` trên `<html>`.
- Tailwind dark: variants everywhere.

## Dependencies chính (từ package.json)

- `@supabase/supabase-js` — Backend client
- `@superapp/iam` — Auth & company context (shared package)
- `@superapp/einvoice` — E-invoice integration
- `@repo/types`, `@repo/ui` — Shared types & UI components
- `recharts` — Charts
- `react-beautiful-dnd` — Drag & drop (editable grids)
- `xlsx` — Excel import/export

## Build & Dev

```bash
npm run dev          # Vite dev server, port 5176
npm run build        # Production build
npm run type-check   # tsc --noEmit
npm run test         # Vitest
npm run lint         # ESLint
```
