# SYSTEM ARCHITECTURE

Cashflow là ứng dụng web AI-native sử dụng frontend React + Supabase backend. Kiến trúc được chia thành 3 lớp chính:

1. **Frontend Web App (Vite + React 18 + TypeScript)**
2. **Supabase Platform (PostgreSQL + Auth + Storage + Edge Functions)**
3. **AI Agent Layer (Product/Flow/Architecture/Builder/QA… agents)** hỗ trợ tạo tài liệu, kiểm tra flow, và điều phối phát triển.

---

## TECH STACK

### Frontend
- React 18 + TypeScript
- Vite build tool
- TailwindCSS + custom UI components
- React Context + custom hooks (`useAuth`, `useImport`, …)
- Supabase JS client cho realtime + CRUD
- Vercel deploy + CDN

### Backend / Platform
- Supabase (PostgreSQL 15) làm database chính
- Supabase Auth (email/password + JWT) và Row Level Security cho từng bảng
- Supabase Storage cho file template/import log (tương lai)
- Edge Functions (dự kiến) để xử lý import lớn hoặc tác vụ nền

### Tooling
- Vitest + Testing Library cho unit/UI tests
- ESLint + Prettier
- AI agents (Product Manager, Flow Simulator, Architecture, Builder, QA Gatekeeper, v.v.)

---

## SYSTEM DESIGN

```
┌────────────────────────┐
│    Frontend (React)    │
│ - Pages/DataImport     │
│ - Hooks/services       │
│ - RBAC & audit UI      │
└──────────┬────────────┘
           │ Supabase JS SDK
┌──────────▼────────────┐
│   Supabase Backend    │
│ - Auth & RLS          │
│ - Tables: users,      │
│   customers,          │
│   transactions, audit │
│ - Edge Functions      │
└──────────┬────────────┘
           │ SQL / REST
┌──────────▼────────────┐
│ PostgreSQL Database   │
│ - JSONB staff perms   │
│ - Audit log & history │
│ - Import metadata     │
└────────────────────────┘
```

- **Pages/DataImport/CustomerImport.tsx** xử lý cả single-entry và bulk import.
- **services/database.ts** cung cấp hàm `customers.bulkCreateCustomers`, `transactions.bulkCreateTransactions` (đã kết nối Supabase) cùng logic seed (đang dần loại bỏ khi chạy dữ liệu thật).
- **Audit logging** (planned) sẽ được hiện thực bằng bảng `import_logs` hoặc mở rộng `audit_logs` hiện có.

---

## DATA FLOW – IMPORT FEATURE

### 1. Single Entry Customer Import
1. User (Admin/Manager/Staff có quyền) truy cập tab Import → "Nhập từng khách hàng".
2. Frontend form thu thập Mã KH, Tên KH, SĐT + optional fields.
3. Form validation client-side (format) → call `databaseService.customers.createCustomer`.
4. Supabase insert vào `customers`, trigger RLS kiểm tra branch + role.
5. Success → frontend reset form, hiển thị toast, ghi audit ({user_id, action="single_customer_import", success_count=1}).

### 2. Bulk Import Customers/Transactions
1. User chọn file Excel/CSV (<=200 dòng). Client parse dùng `xlsx`.
2. Component chạy validation: field bắt buộc, format, lookup Mã KH và Loại giao dịch.
3. Nếu còn lỗi: disable import, hiển thị bảng lỗi → user chỉnh file & upload lại.
4. Khi hợp lệ: gửi payload tới Supabase (upsert/insert hàng loạt). Có thể chia batch 50-100 rows để tránh timeout.
5. Supabase xử lý, trả danh sách thành công/thất bại. Frontend hiển thị modal kết quả.
6. Ghi audit log (hoặc bảng `import_history`): user, loại import, success_count, timestamp.

### 3. Permission & RBAC Integration
- `useAuth` tải role + `staff_permissions` JSONB.
- Component DataImport kiểm tra `hasPermission("customers","import")` hoặc `hasPermission("transactions","import")` trước khi render controls.
- Nếu không đủ quyền → chỉ hiển thị hướng dẫn + CTA yêu cầu Admin cấp quyền.

---

## SECURITY & RLS SUMMARY
- Các bảng `customers`, `transactions`, `users`, `audit_logs` đã bật RLS.
- Chính sách hiện có:
  - Admin: full access.
  - Branch Manager: CRUD trong branch của họ.
  - Staff: quyền tuỳ chỉnh bằng JSON `staff_permissions`.
- Import endpoints sử dụng cùng Supabase client nên tuân theo RLS.
- Cần bổ sung chính sách ghi audit log để không cho phép user thường chỉnh sửa log.

---

## SCALABILITY CONSIDERATIONS
- **Batch size & retry:** Bulk import nên chia batch (ví dụ 50 rows) để tránh hit Supabase rate limit (10 requests/second cho free tier). Có thể queue background job bằng Edge Function nếu nhu cầu >200 dòng.
- **File parsing:** Hiện tại xử lý trên client (JS). Đảm bảo browser không bị treo với 200 dòng; nếu lớn hơn nên upload lên Edge Function để xử lý server-side.
- **Audit log volume:** Ghi lại mỗi import sẽ tăng log nhanh → cần index theo `created_at` và `user_id`, và có job dọn dẹp định kỳ.
- **Vendor lock-in:** Supabase cung cấp cả Auth + DB. Nếu nhu cầu vượt plan, cân nhắc self-host Supabase hoặc chuyển sang PostgreSQL quản lý riêng (giữ schema tương thích để dễ di chuyển).
- **Pricing triggers:**
  - Supabase: số lượng row đọc/ghi, RLS policies, storage file (template/log).
  - Vercel: build minutes + Edge Function execution nếu dùng background import.

---

## NEXT STEPS / RECOMMENDATIONS
1. **Finalize Audit Log Schema:** tạo bảng `import_history` (id, user_id, import_type, success_count, failed_count, created_at, metadata JSON).
2. **Edge Function for Large Imports:** chuẩn bị function `import-transactions` để xử lý file lớn (>200) trong tương lai.
3. **Permission Middleware:** tạo hook chung `usePermissionGate` để disable toàn bộ UI khi user thiếu quyền.
4. **Monitoring:** thêm bảng `import_metrics` hoặc log sang monitoring service để theo dõi thời gian xử lý, tỉ lệ lỗi.