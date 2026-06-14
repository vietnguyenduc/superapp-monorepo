# Implementation Plan: Phase 3 — Test Coverage for Remaining Apps

## Tổng quan

Phase 3 bổ sung unit tests cho 3 apps chưa có test coverage đầy đủ:
- **operations-portal** (ưu tiên cao) — 9 pages, 2 tests hiện có
- **hr-operation** (ưu tiên trung bình) — 7 pages, 3 tests hiện có + 1 service test
- **admin-portal** (ưu tiên trung bình) — 5 pages, 3 tests hiện có + 1 context test

## Pattern Testing hiện tại (đã xác nhận từ code)

Cả 3 app đều dùng chung pattern:
- **Vitest** + **jsdom** environment
- **@testing-library/react** + **@testing-library/jest-dom**
- **vi.mock()** cho tất cả dependencies (supabase, router, icons)
- **Dynamic import** trong test (`await import('../Component')`)
- **MemoryRouter** wrapper cho component test
- Mock supabase với chainable methods (`.from().select().eq()`)

---

## A. operations-portal — 7 tests cần thêm

### A1. DocumentsPage.test.tsx
- **File test:** `src/pages/__tests__/DocumentsPage.test.tsx`
- **Mock cần:** supabase (from, select, order, eq, single, insert, storage.from.upload), trialData, getCurrentUserId
- **Test cases:**
  1. Renders page title "Tài liệu Vận hành"
  2. Renders upload form (file input + "Tải lên" button)
  3. Shows loading state initially
  4. Renders document list after loading (mock data)
  5. Shows empty state when no documents

### A2. TicketsPage.test.tsx
- **File test:** `src/pages/__tests__/TicketsPage.test.tsx`
- **Mock cần:** supabase, trialData, getCurrentUserId
- **Test cases:**
  1. Renders page title "Sự cố Vận hành"
  2. Renders create ticket button
  3. Shows loading state
  4. Renders ticket list after loading

### A3. AssetsPage.test.tsx
- **File test:** `src/pages/__tests__/AssetsPage.test.tsx`
- **Mock cần:** supabase, trialData
- **Test cases:**
  1. Renders page title "Quản lý Tài sản"
  2. Renders tabs (Tài sản, Vật tư tiêu hao)
  3. Shows loading state
  4. Renders asset list after loading

### A4. EmergencyPage.test.tsx
- **File test:** `src/pages/__tests__/EmergencyPage.test.tsx`
- **Mock cần:** supabase, trialData
- **Test cases:**
  1. Renders page title "Liên hệ Khẩn cấp"
  2. Shows loading state
  3. Renders contact list after loading

### A5. TrainingPage.test.tsx
- **File test:** `src/pages/__tests__/TrainingPage.test.tsx`
- **Mock cần:** supabase, trialData, getCurrentUserId
- **Test cases:**
  1. Renders page title "Đào tạo"
  2. Shows loading state
  3. Renders course list after loading

### A6. ChatPage.test.tsx
- **File test:** `src/pages/__tests__/ChatPage.test.tsx`
- **Mock cần:** supabase (channel, realtime), trialData, getCurrentUserId
- **Test cases:**
  1. Renders page title "Chat"
  2. Renders message input
  3. Shows loading state

### A7. App.test.tsx
- **File test:** `src/__tests__/App.test.tsx`
- **Mock cần:** tất cả page components (shallow), react-router-dom
- **Test cases:**
  1. Renders header with app name
  2. Renders sidebar navigation
  3. Renders mobile bottom nav
  4. Default redirect to /dashboard

---

## B. hr-operation — 5 tests cần thêm

### B1. AttendancePage.test.tsx
- **File test:** `src/pages/__tests__/AttendancePage.test.tsx`
- **Mock cần:** lucide-react icons, react-router-dom
- **Test cases:**
  1. Renders page title "Chấm công"
  2. Renders check-in tab with camera button
  3. Renders import tab
  4. Renders history tab

### B2. PayrollManagement.test.tsx
- **File test:** `src/pages/__tests__/PayrollManagement.test.tsx`
- **Mock cần:** lucide-react icons
- **Test cases:**
  1. Renders page title "Quản lý Lương"
  2. Renders stat cards
  3. Renders employee payroll list

### B3. PerformanceDashboard.test.tsx
- **File test:** `src/pages/__tests__/PerformanceDashboard.test.tsx`
- **Mock cần:** lucide-react icons
- **Test cases:**
  1. Renders page title "Đánh giá Hiệu suất"
  2. Renders OKR list
  3. Renders add objective button

### B4. HRSettings.test.tsx
- **File test:** `src/pages/__tests__/HRSettings.test.tsx`
- **Mock cần:** lucide-react icons
- **Test cases:**
  1. Renders page title "Cài đặt HR"
  2. Renders save button
  3. Renders settings sections

### B5. App.test.tsx
- **File test:** `src/__tests__/App.test.tsx`
- **Mock cần:** tất cả page components, react-router-dom, lucide-react
- **Test cases:**
  1. Renders header with app name
  2. Renders navigation
  3. Default redirect to /employees

---

## C. admin-portal — 3 tests cần thêm

### C1. ConsolidatedReports.test.tsx
- **File test:** `src/pages/__tests__/ConsolidatedReports.test.tsx`
- **Mock cần:** lucide-react, supabase, AdminContext, @superapp/iam
- **Test cases:**
  1. Renders page title "Consolidated Reports"
  2. Renders metric cards
  3. Shows loading state

### C2. DataLifecycle.test.tsx
- **File test:** `src/pages/__tests__/DataLifecycle.test.tsx`
- **Mock cần:** lucide-react, supabase, AdminContext, @superapp/iam
- **Test cases:**
  1. Renders page title "Data Lifecycle"
  2. Renders data management sections
  3. Renders wipe data button

### C3. App.test.tsx
- **File test:** `src/__tests__/App.test.tsx`
- **Mock cần:** tất cả page components, react-router-dom, lucide-react, AdminContext, @superapp/iam
- **Test cases:**
  1. Renders header with app name
  2. Renders navigation
  3. Default redirect to /companies

---

## D. Kiểm tra và xác nhận

Sau khi viết tất cả tests, chạy:
```bash
cd apps/operations-portal && npx vitest run
cd apps/hr-operation && npx vitest run
cd apps/admin-portal && npx vitest run
```

## Tổng kết

| App | Tests hiện có | Tests cần thêm | Tổng |
|-----|:-------------:|:--------------:|:----:|
| operations-portal | 2 | 7 | 9 |
| hr-operation | 4 | 5 | 9 |
| admin-portal | 4 | 3 | 7 |
| **Tổng** | **10** | **15** | **25** |
