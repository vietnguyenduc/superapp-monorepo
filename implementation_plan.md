# Fix UI/UX Issues — Implementation Plan

## Tổng quan các lỗi cần fix

### 1. 🔴 `hasPermission is not a function` — PermissionDemoPage (inventory-operation)
- **Root cause:** `PermissionDemoPage` imports `useAuthContext as useAuth` from `@superapp/iam`, nhưng `AuthContextType` interface KHÔNG có `hasPermission`. `hasPermission` chỉ có trong `usePermissions` hook riêng.
- **Fix:** Thêm `hasPermission` vào `AuthContextType` interface và implement trong `AuthProvider`.

### 2. 🟡 `react-i18next:: useTranslation: You will need to pass in an i18next instance` (sales-operation, inventory-operation)
- **Root cause:** Các app này dùng `useTranslation` từ `react-i18next` nhưng chưa gọi `initReactI18next` ở entry point.
- **Fix:** Thêm i18n init vào `main.tsx` của sales-operation và inventory-operation.

### 3. 🟡 `No routes matched location "/login"` (operations-portal, hr-operation)
- **Root cause:** Các app này không có route `/login` trong App.tsx, nhưng `ProtectedRoute` redirect về `/login`.
- **Fix:** Thêm route `/login` vào App.tsx của operations-portal và hr-operation.

### 4. 🟡 `invalid input syntax for type uuid: "trial-company"` (cashflow, inventory-operation)
- **Root cause:** Trial mode dùng `company_id = "trial-company"` (string), nhưng Supabase query dùng UUID type.
- **Fix:** Sửa `fetchUserProfile` trong `useAuth` (packages/iam) để skip DB query khi là trial user.

### 5. 🟡 `PGRST201 — Could not embed because more than one relationship` (hr-operation)
- **Root cause:** Query `employees` với `departments` embed có nhiều relationships.
- **Fix:** Sửa query để chỉ định relationship cụ thể.

### 6. 🟡 React Router Future Flags (7/7 apps)
- **Root cause:** Chưa thêm `future` flags vào `BrowserRouter`.
- **Fix:** Thêm `future={{ v7_startTransition: true, v7_relativeSplatPath: true }}` vào tất cả BrowserRouter.

### 7. 🟡 `Objects are not valid as a React child` (cashflow)
- **Root cause:** Render error object trực tiếp trong JSX thay vì error.message.
- **Fix:** Sửa component render error.

---

## Thứ tự thực hiện

| Step | Issue | App(s) | Complexity |
|------|-------|--------|:----------:|
| 1 | hasPermission | inventory-operation | Low |
| 2 | i18n init | sales-operation, inventory-operation | Low |
| 3 | Login route | operations-portal, hr-operation | Low |
| 4 | trial-company UUID | cashflow, inventory-operation (packages/iam) | Medium |
| 5 | PGRST201 | hr-operation | Low |
| 6 | React Router future flags | ALL 7 apps | Low |
| 7 | Objects not valid child | cashflow | Low |
