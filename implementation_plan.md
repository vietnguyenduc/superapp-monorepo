# Phase 3 — QA/QE: operations-portal, hr-operation, admin-portal

## Mục tiêu
Thiết lập test infrastructure + viết unit tests cho 3 app chưa có test.

---

## 1. operations-portal (20 files, 0 tests)

### Trạng thái hiện tại
- **package.json**: ❌ Không có `vitest` / `@testing-library/*` / `jsdom`
- **vite.config.ts**: ❌ Không có `test` config
- **Scripts**: ❌ Không có `test`, `test:watch`, `test:coverage`

### Công việc
1. **Cài đặt dependencies**: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
2. **Thêm `test` config vào `vite.config.ts`** (giống cashflow pattern)
3. **Thêm scripts** vào `package.json`: `test`, `test:watch`, `test:coverage`
4. **Viết tests**:
   - `src/lib/__tests__/supabase.test.ts` — mock supabase client
   - `src/pages/__tests__/Dashboard.test.tsx` — render + navigation
   - `src/pages/__tests__/CheckInPage.test.tsx` — render + basic interaction
   - `src/components/Layout/__tests__/AppSwitcher.test.tsx` — render

---

## 2. hr-operation (16 files, 0 tests)

### Trạng thái hiện tại
- **package.json**: ✅ ĐÃ có `vitest`, `@testing-library/*`, `jsdom`, `test` scripts
- **vite.config.ts**: ❌ Không có `test` config
- **Scripts**: ✅ `test`, `test:watch`, `test:coverage` đã có

### Công việc
1. **Thêm `test` config vào `vite.config.ts`**
2. **Viết tests**:
   - `src/services/__tests__/hrService.test.ts` — mock supabase, test CRUD methods
   - `src/pages/__tests__/EmployeeDirectory.test.tsx` — render + list
   - `src/pages/__tests__/LeaveManagement.test.tsx` — render
   - `src/pages/__tests__/ShiftManagement.test.tsx` — render
   - `src/components/Layout/__tests__/AppSwitcher.test.tsx` — render

---

## 3. admin-portal (15 files, 0 tests)

### Trạng thái hiện tại
- **package.json**: ❌ Không có `vitest` / `@testing-library/*` / `jsdom`
- **vite.config.ts**: ❌ Không có `test` config
- **Scripts**: ❌ Không có `test` scripts

### Công việc
1. **Cài đặt dependencies**: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
2. **Thêm `test` config vào `vite.config.ts`**
3. **Thêm scripts** vào `package.json`
4. **Viết tests**:
   - `src/contexts/__tests__/AdminContext.test.tsx` — mock supabase, test context
   - `src/pages/__tests__/IdentityManagement.test.tsx` — render
   - `src/pages/__tests__/CompanyManagement.test.tsx` — render
   - `src/pages/__tests__/GlobalSettings.test.tsx` — render

---

## Thứ tự thực hiện

| Step | App | Action |
|------|-----|--------|
| 1 | operations-portal | Cài đặt deps + config + scripts |
| 2 | operations-portal | Viết tests |
| 3 | operations-portal | Chạy verify |
| 4 | hr-operation | Thêm test config |
| 5 | hr-operation | Viết tests |
| 6 | hr-operation | Chạy verify |
| 7 | admin-portal | Cài đặt deps + config + scripts |
| 8 | admin-portal | Viết tests |
| 9 | admin-portal | Chạy verify |
| 10 | ALL | Chạy tổng thể, báo cáo kết quả |

## Verification
- Mỗi app: `cd apps/<app> && npx vitest run`
- Tổng thể: `npx vitest run` từ root (nếu có workspace config)
