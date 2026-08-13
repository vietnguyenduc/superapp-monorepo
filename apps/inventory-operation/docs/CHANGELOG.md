# inventory-operation — Changelog

## 2026-08-13 — Align special outbound payloads with DB columns and approval log fix

- `src/lib/supabase.ts`: thêm `getCurrentBranchId()` để lấy `branch_id` từ bảng `users`.
- `src/services/specialOutboundService.ts`:
  - `createRecord` gửi đúng các cột DB (`requested_by`, `company_id`, `branch_id`, `date`, `product_id`, `quantity`, `unit`, `reason`, `notes`, `reason_detail`) thay vì các cột không tồn tại (`created_by`, `updated_by`) hoặc thiếu (`requested_by`, `branch_id`).
  - `updateRecord`/`approveRecord`/`rejectRecord`/`deleteRecord` dùng đúng cột `approved_by`, `approved_at`, `rejection_reason`, `updated_at`.
  - `createApprovalLog` chuyển sang `supabase` với `.maybeSingle()` và gửi đủ `record_type`, `status`, `user_role`.
- Migration `supabase/migrations/20260804000003_special_outbound_records_notes_and_reason_detail.sql`: thêm cột `notes`, `reason_detail` cho bảng `special_outbound_records`.

## 2026-08-13 — Fix approval_logs payload and tenant scoping

- `src/lib/supabase.ts`: thêm `getCurrentUserRole()` để lấy `role` từ bảng `users`.
- `src/services/specialOutboundService.ts`: khi tạo `approval_logs` giờ gửi đầy đủ các cột bắt buộc (`record_type`, `status`, `user_role`) cùng `record_id`, `action`, `comment`, `user_id`, `user_name`, tránh lỗi RLS/column-not-null khi ghi log duyệt xuất đặc biệt.

## 2026-08-04 — Dịch nhãn Trial Mode

- `src/pages/ProfilePage.tsx`: fallback email "Trial Mode" → "Chế độ thử nghiệm".
- `src/components/Layout/Navigation.tsx`: badge "(Trial Mode)" → "(Chế độ thử nghiệm)".
- `src/lib/supabase.ts`: thông báo lỗi Trial Mode chuyển sang tiếng Việt.

## 2026-08-12 — Tenant scoping, RLS-safe reads, import date parsing

- `src/lib/supabase.ts`: `getCurrentUser` / `isAuthenticated` thêm guard khi `auth` không khả dụng; giữ `getCurrentCompanyId`.
- `src/services/productService.ts`, `inventoryService.ts`, `salesService.ts`, `inventoryMovementService.ts`, `inventoryVarianceService.ts`, `specialOutboundService.ts`, `exportService.ts`: thêm `getCurrentCompanyId()`, lọc theo `company_id`, chèn `company_id` khi tạo mới, `.single()` chuyển `.maybeSingle()`.
- `src/pages/InventoryImport.tsx`, `InventoryTransactionImportPage.tsx`, `ProductBulkImportComplete.tsx`, `src/services/googleSheetsService.ts`, `src/services/mappers/*.ts`: dùng `parseDateOrNow` từ `@superapp/shared-utils` để hỗ trợ DD/MM/YYYY.
- `src/index.css`: tăng tương phản `.btn-secondary`.
