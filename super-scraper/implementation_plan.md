# Kế hoạch thực hiện: QA/QE Codebase Monorepo (Phase 1 — Sales + Inventory)

## Mục tiêu
Xây dựng hệ thống Kiểm thử & Đảm bảo chất lượng (QA/QE) tự động cho 2 ứng dụng React trong monorepo:
- **`apps/sales-operation`** (203 files, 0 tests hiện tại)
- **`apps/inventory-operation`** (202 files, 0 tests hiện tại)

## Hiện trạng (sau phân tích)

### ✅ Đã có sẵn
- Vitest config với jsdom, globals, setupFiles
- tests/setupTests.ts với mock Supabase, matchMedia, ResizeObserver
- Dev dependencies: @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom
- BaseService.execute() pattern với fallback mechanism
- FallbackService singleton với mock data, persist localStorage

### ❌ Thiếu
- 0 unit tests cho services
- 0 component tests cho UI components
- 0 integration tests
- 0 E2E tests
- Không có CI/CD pipeline
- Không có coverage report

## Các bước thực hiện

### Step 6a: Phân tích ✅
- [x] Đọc vitest.config.ts, setupTests.ts, package.json
- [x] Xác định mock Supabase pattern, BaseService + FallbackService pattern

### Step 6b: Unit Tests cho Services (Sales)
- [ ] baseService.test.ts
- [ ] productService.test.ts
- [ ] inventoryService.test.ts
- [ ] salesService.test.ts
- [ ] fallbackService.test.ts

### Step 6c: Unit Tests cho Services (Inventory)
- [ ] baseService.test.ts
- [ ] productService.test.ts
- [ ] inventoryService.test.ts
- [ ] salesService.test.ts
- [ ] fallbackService.test.ts

### Step 6d: Component Tests
- [ ] Sales: Button, DataTable, FormField, Layout, ProtectedRoute
- [ ] Inventory: Button, Table, InventoryInputForm, ProductEntryForm, Layout, ProtectedRoute

### Step 6e: Hook Tests
- [ ] Sales: useAuth, usePermissions
- [ ] Inventory: useInventory, useProductCatalog

### Step 6f: Page Tests (Integration)
- [ ] Sales: Login, DashboardPageEnhanced
- [ ] Inventory: Login, DashboardPageEnhanced, InventoryInputPage

### Step 6g: Setup CI/CD
- [ ] ci-sales-operation.yml
- [ ] ci-inventory-operation.yml

### Step 6h: Verify & Fix
- [ ] Chạy npm run test cho Sales
- [ ] Chạy npm run test cho Inventory
- [ ] Chạy npm run test:coverage
- [ ] Chạy npm run type-check
