# Bài học qua 110+ PR & Playbook cho app mới

> File này tổng hợp những vấn đề lặp lại nhiều lần qua các PR của `superapp-monorepo` và đề xuất cách làm app mới ổn định, nhanh, ít lỗi vặt.

---

## 1. Kiến trúc & setup ban đầu (Foundation)

### 1.1. Chọn stack đúng chuẩn repo
- **React 18 + Vite 8 + TypeScript strict + Tailwind CSS**.
- Không dùng Next.js, không dùng Redux.
- State cục bộ bằng React hooks; cross-app state qua Supabase Realtime hoặc shared tables.
- Dùng `@repo/ui` cho components chung, `@superapp/theme` cho design tokens.

### 1.2. Thiết kế package/shared-utils ngay từ đầu
- Mọi logic dùng chung (Supabase client, date/amount parser, RBAC helpers, error formatter) phải nằm trong `packages/` hoặc `@superapp/shared-utils`.
- **Không copy-paste** `apiClient`, `BaseService`, `parseAmount`, `formatDate` vào từng app.
- Mỗi app chỉ import `databaseService` từ shared-utils, không tự xây raw Supabase call rời rạc.

### 1.3. Triển khai trial mode đồng bộ từ đầu
- Trial mode dùng `@superapp/trial-client` với `localStorage`.
- App mới cần seed data rõ ràng trong `trial_seed.data` (JSONB) và UI phải resolve label → ID trước khi insert (ví dụ `CUST0001 - Tên KH` phải parse ra `customer_id`).
- Không để trial mode là "đường tắt" bị bỏ qua validation.

---

## 2. Multi-tenancy & RLS

### 2.1. Mọi table business đều phải có `company_id`
- Quên `company_id` trong payload `upsert`/`update` là nguyên nhân hàng đầu của lỗi `new row violates row-level security policy`.
- Khi `upsert`, luôn include đầy đủ: `company_id`, `status`, `full_name` (nếu có), `updated_at`.

### 2.2. RLS policy đơn giản, không over-engineering
- `USING` và `WITH CHECK` dựa trên `auth.jwt() ->> 'company_id'`.
- Không dùng schema-per-tenant.
- Test RLS bằng local Supabase mirror (`packages/api` + InsForge MCP) trước khi lên production.

### 2.3. Tenant fields không bao giờ bị ghi đè
- Trong mọi `update`/`upsert`, xóa `id`, `created_at`, `company_id`, `branch_id` khỏi user payload trước khi gửi DB.
- Dùng helper `sanitizeTenantFields(payload)` chung để tránh quên.

---

## 3. Auth / RBAC

### 3.1. JWT claims là nguồn thật
- `company_id`, `role`, `app_permissions` đọc từ JWT, không lưu riêng vào localStorage.
- Đăng nhập không được overwrite `role`/`company_id` bằng giá trị mặc định.
- Staff permission phải check `staff_permissions.<module>.<action>` trong JWT, không chỉ check `role === 'staff'`.

### 3.2. Các quyền cần định nghĩa rõ từ đầu
- `view`, `create`, `edit`, `delete`, `approve`, `bypass_approval`, `manage_all`.
- Dùng helper `canApproveTransactions`, `canBypassEntityApproval`, `getInitialTransactionStatus` có sẵn.
- Tab/settings chỉ hiện khi user có quyền tương ứng.

### 3.3. Cookie domain share session
- Production: `.appforyou.xyz`.
- Local: `localhost`.
- Không để session lệch giữa các subdomain.

---

## 4. Data flow & business logic

### 4.1. Single source of truth cho balance / số dư
- `total_balance` của customer và `balance` của bank account phải được cập nhật **write-time** (khi insert/update/delete transaction), không để frontend tự tính rồi update.
- Dùng `getCustomerBalanceDelta` / `getBankAccountBalanceDelta` chuẩn, tránh mỗi nơi tính 1 kiểu.
- Draft/pending/rejected transaction **không** làm thay đổi balance.

### 4.2. Math factor cho loại giao dịch
- Mỗi `transaction_type` có `math_factor` (+1 hoặc -1).
- UI hiển thị amount dương/âm theo convention: positive balance = công nợ (khách nợ tiền).
- Không lấy `Math.abs(amount)` vô tội vạ.

### 4.3. Định dạng ngày tháng chuẩn Việt Nam
- Mọi nơi dùng `DD/MM/YYYY`.
- `parseDate` ưu tiên `DD/MM/YYYY`, từ chối `MM/DD` hoặc convert rõ ràng.
- Không dùng `new Date(string)` trực tiếp vì nó parse theo locale máy.

### 4.4. Số tiền parse chuẩn
- Hỗ trợ `1.000.000`, `1,000,000.50`, `1000000`.
- Dùng `parseAmount` / `parseAmountOrNull` duy nhất, không viết regex mới.

---

## 5. Import / Export (nơi hay sinh lỗi nhất)

### 5.1. Template mẫu không được gây trùng key
- Template phải để `transaction_code`/`customer_code` trống hoặc là mã giả (`Mẫu 1`, `Mẫu 2`) không thể import trực tiếp.
- Nếu user để mã template nguyên, import lần 2 sẽ bị trùng unique constraint.

### 5.2. Validate trước khi insert
- Kiểm tra duplicate trong file, duplicate với DB, customer lookup, loại giao dịch, amount, date.
- Trả về **danh sách lỗi theo dòng** (`Dòng X: ...`) bằng tiếng Việt, không để Postgres báo `duplicate key value violates unique constraint` chung chung.

### 5.3. Lookup chấp nhận nhiều dạng input
- `customer_code`, `id`, `full_name` (hoặc label `CODE - Name`).
- `transaction_type` accept `id`, `name` tiếng Việt, `canonical` tiếng Anh.
- Bank / branch accept `account_number`, `name`, `code`.

### 5.4. Export đúng filter & cột đang hiển thị
- Nút "Xuất Excel" phải gửi cùng filter đang chọn trên màn hình, không export toàn bộ DB.
- Số tiền export dạng number để Excel tính toán được.

### 5.5. CSV/Excel parser dùng chung
- Dùng `@superapp/shared-utils/parseFile` hoặc `importUtils` chuẩn, không viết parser riêng trong mỗi app.
- Chấp nhận tiêu đề tiếng Việt (`Mã khách hàng`, `Số dư đầu kỳ`) và tiếng Anh.

---

## 6. UI/UX

### 6.1. Apple HIG + Tailwind
- Dùng `Button variant="primary"` cho action chính, `variant="secondary"` cho import/export/filter.
- Không viết `<button className="bg-blue-600 ...">` một lần.
- `secondary` button phải có viền rõ, background trắng/dark, text đậm để tương phản.

### 6.2. Responsive & mobile
- Mobile: bảng dài chuyển thành cards; header sticky `z-[200]`; FAB `bottom-20` để không che bottom nav; bottom padding `pb-36`.
- Table: freeze cột đầu (`GD`, `Mã`, `Tên`, `Công nợ`) với `sticky` + width cố định.
- Date picker / filter gọn gàng, không chiếm nửa màn hình.

### 6.3. Settings menu gọn
- Gộp tab liên quan (`Loại giao dịch + Công thức dư nợ`, `Tài khoản & Phân quyền + Phân quyền duyệt + Tích hợp`).
- Reset / backup để 1 nút rõ nghĩa, tránh tên kỹ thuật như "reset về null".

### 6.4. Thông báo lỗi thân thiện
- Tất cả lỗi user-facing bằng tiếng Việt, không để `Customer not found`, `Parse error`, `Transaction not found`.
- Mỗi lỗi kèm hành động: "Mã khách hàng không tồn tại. Vui lòng kiểm tra danh sách khách hàng."
- Lỗi import hiển thị list theo dòng, có scroll.

---

## 7. Validation & Error Handling

### 7.1. Không để `try/catch` nuốt lỗi
- Log lỗi bằng `logger.error`, hiển thị bằng `toast.error` hoặc inline error.
- Không dùng `console.log` / `alert`.

### 7.2. Một nơi validate, không hai bộ song song
- `businessLogic/validation.ts` dùng cho create/update.
- `importUtils` dùng cho import.
- Đảm bảo cả hai cùng quy tắc (required fields, duplicate check, amount format, date format).

### 7.3. Error message standardized
- Tạo helper `getErrorMessage(error)` ở `@superapp/shared-utils` để map Supabase error / raw error thành tiếng Việt.
- Service trả về `{ data, error: { message } }` đồng nhất; UI không tự `String(error)`.

---

## 8. Testing

### 8.1. Unit test theo từng service
- `npm run test -w <app>` phải pass trước khi commit.
- Test case bắt buộc: create/read/update/delete, bulk import duplicate, balance sync, RLS, trial mode.

### 8.2. E2E với browser
- Mọi thay đổi UI phải verify trên browser đúng URL (local/preview/production theo branch).
- Test golden path: login → tạo transaction → import → export → đồng bộ balance.

### 8.3. Test dữ liệu biên
- Số tiền âm/dương, amount `0`, date `DD/MM` vs `MM/DD`, duplicate code, file rỗng, file thiếu cột.

---

## 9. CI/CD & Deploy

### 9.1. Vercel Git auto-deploy tắt, dùng GitHub Actions
- `git.deploymentEnabled: false` trong `vercel.json`.
- `Deploy changed Vercel apps` workflow chỉ deploy app có thay đổi, không deploy 7 app cùng lúc.
- Preview alias cố định `<app>-preview.appforyou.xyz`.

### 9.2. `ignoreCommand` ngắn gọn
- Dùng `scripts/vercel-ignore.sh`, không viết command dài > 256 ký tự trong `vercel.json`.

### 9.3. Domain & env vars
- Đăng ký production domain ngay khi app được tạo: `https://<short>.appforyou.xyz`.
- Cấu hình env `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, cookie domain, CORS Supabase ngay từ đầu.

### 9.4. Quota & retry
- Vercel Hobby 100 deploy/ngày. Tránh push nhiều lần lên `viet` khi chưa cần.
- Dùng cron auto-retry nếu deploy bị rate-limit.

---

## 10. Documentation discipline

### 10.1. Mỗi app có đủ 12 file docs
- `OVERVIEW`, `ARCHITECTURE`, `API`, `FLOWS`, `DATA-MODEL`, `DATA-FLOW`, `UI-UX`, `PRD`, `ROLES-PERMISSIONS`, `RUNBOOK`, `AI-CONTEXT`, `CHANGELOG`.
- Cập nhật `CHANGELOG.md` sau mỗi PR.
- `AI-CONTEXT.md` ghi conventions, common pitfalls, cách test.

### 10.2. Đọc docs trước khi code
- Nếu task liên quan app cụ thể, đọc `apps/<app>/docs/OVERVIEW.md` + `AI-CONTEXT.md` trước.
- Nếu task cross-app, đọc `docs/ARCHITECTURE.md` + `docs/AUTH-AND-RBAC.md`.

### 10.3. Ghi lại decision & error pattern
- Dùng InsForge MCP `log_decision` cho quyết định kiến trúc.
- Dùng `log_error_pattern` cho lỗi đã fix để agent sau không mắc lại.

---

## 11. Checklist tạo app mới

### Phase 1 — Scaffold (1 PR)
- [ ] Tạo `apps/<new-app>` với Vite + React + TS + Tailwind theo template.
- [ ] Cấu hình `vercel.json`, `.vercelignore`, `vite.config.ts`, `tsconfig.json`.
- [ ] Thêm app vào root `package.json` workspaces, `turbo.json`.
- [ ] Đăng ký Vercel project + production domain `<short>.appforyou.xyz`.
- [ ] Tạo 12 file docs cơ bản.

### Phase 2 — Auth & Company context (1 PR)
- [ ] Tích hợp `@superapp/iam` (`AuthProvider`, `CompanyProvider`, `useAuth`, `useCompany`).
- [ ] Lấy `company_id` từ JWT, lưu context.
- [ ] Cấu hình cookie domain `.appforyou.xyz`.

### Phase 3 — Shared services (1-2 PR)
- [ ] Tạo `databaseService` cho app, kế thừa `BaseService`.
- [ ] Implement CRUD cơ bản với RLS + tenant fields.
- [ ] Seed trial data và trial mode.

### Phase 4 — Core features (nhiều PR nhỏ)
- [ ] List + filter + pagination.
- [ ] Create/edit modal với validation chuẩn.
- [ ] Bulk import/export.
- [ ] Dashboard / reports.

### Phase 5 — UI/UX polish (1 PR)
- [ ] Apple HIG, responsive, dark mode, sticky headers, buttons.
- [ ] Thông báo lỗi tiếng Việt, error list.

### Phase 6 — Testing & deploy (1 PR)
- [ ] Unit tests > 80% functions.
- [ ] Browser verification trên preview.
- [ ] Merge `viet` → `main`, verify production.

---

## 12. Đề xuất phân công agent

| Area | Agent / Responsibility | Deliverable |
|---|---|---|
| Architecture Agent | Quyết định package structure, data model, RLS, shared-utils | ADR, schema design |
| Backend/Data Agent | Migrations, triggers, RPC, balance sync, import/export logic | `*_service.ts`, tests |
| UI/UX Agent | Components, responsive, Apple HIG, error messages, i18n | React pages + UI tests |
| QA Agent | Unit/E2E tests, biên, RLS, trial mode | Test suite + report |
| DevOps Agent | Vercel config, domains, GitHub Actions, env vars, CORS | Deploy pipeline ready |
| Docs Agent | Giữ 12 file docs, CHANGELOG, AI-CONTEXT cập nhật | Docs PR song hành |

---

## 13. Các anti-pattern cần tránh (đã gặp trong PR)

1. **Hai bộ validation song song không đồng nhất** → import lọt lỗi.
2. **Upsert thiếu `company_id`** → RLS error khó hiểu.
3. **Template import có mã cứng (`GC-001`)** → user import 2 lần là trùng.
4. **`Math.abs(amount)` lung tung** → số dư sai.
5. **Lỗi tiếng Anh kỹ thuật hiển thị cho user** → user không hiểu.
6. **Deploy 7 app cùng lúc vì Vercel Git auto-deploy** → quota hết, preview fail.
7. **Không update docs sau code** → agent sau làm lại từ đầu.
8. **Preview URL cũ / alias chưa cập nhật** → verify nhầm deployment.
9. **Import/export không theo filter** → user xuất sai dữ liệu.
10. **Trial mode không resolve label → ID** → import trial thành công nhưng balance không đổi.

---

## 14. Case study — Cashflow incidents qua 110+ PR (để rà soát các app khác)

> Dưới đây là các lỗi thực tế đã xảy ra và cách fix. Khi audit app mới, kiểm tra từng điểm này.

### 14.1. Balance & số dư
- **Sai dấu amount**: `Math.abs(amount)` làm mất hướng giao dịch. Fix: `delta = amount × math_factor`.
- **Positive balance = dư nợ (công nợ)**: màu xanh cho âm/credit, đỏ cho dương/debt.
- **Balance tính sai 10x**: `parseAmount` nhầm dấu chấm thập phân `990366250.4` → `9,903,662,504`. Fix: dùng shared `parseAmount` duy nhất và test biên.
- **Double-count sau restore**: restore tính lại `total_balance` từ transactions trên `opening_balance`, nếu `total_balance` cũ không reset sẽ cộng dồn. Fix: reset `total_balance` về `opening_balance` trước khi apply.
- **CustomerDetail tự tính `currentBalance`** riêng, mismatch với `total_balance`. Fix: hiển thị `total_balance` làm single source of truth.
- **Opening balance thay đổi không sync `total_balance`**. Fix: khi `opening_balance` update, `total_balance` += delta, `current_balance` cũng cập nhật.

### 14.2. Transaction types & enum
- **Deposit / `Đặt cọc`**: thêm type mới cần update union type, `balanceMath.ts`, validation, parser, UI labels/colors, i18n, dashboard, group summary, trial seed, migration.
- **Canonical vs display label**: dropdown lưu canonical (`payment`/`charge`/`deposit`), hiển thị tên tiếng Việt. Fix: `TransactionTypeContext` expose `{ id, canonical, name }`.
- **Transaction type guard by ID**: `deleteTransactionType` cần check `transactions.transaction_type` theo canonical, không phải UUID.

### 14.3. Import / Export
- **Bulk import trùng `transaction_code`**: Postgres unique constraint khó hiểu. Fix: pre-check DB + duplicate trong file, auto-generate mã khi để trống.
- **Import không tìm thấy customer**: live path chỉ match `customer_code`, trial path match `id`/`name`. Fix: dùng chung resolver.
- **Template có mã cứng `GC-001`**: user import 2 lần bị trùng. Fix: template để `Số chứng từ` trống và hướng dẫn.
- **Date parser `MM/DD` âm thầm nhầm**: khi cả ngày/tháng ≤ 12. Fix: từ chối hoặc ưu tiên `DD/MM/YYYY`.
- **Export Excel không theo filter**: xuất toàn bộ DB. Fix: gửi filter đang active.
- **Export 0 dòng ra file trống**: file nên có tiêu đề cột.

### 14.4. Auth / RBAC
- **Sign-in overwrite role/company**: `upsert` `public.users` mỗi lần login ghi đè `admin` thành `staff`. Fix: `insert` + ignore 23505.
- **`admin_master`/`admin` default company**: `CompanyBadge` ưu tiên `user.company_id` trước `companies[0]`.
- **Staff permission `customers.manage_all`**: mở tab Số dư đầu kỳ cho staff có quyền.
- **Approval workflow**: 4 status (`draft`/`pending`/`completed`/`rejected`), balance chỉ sync khi `completed`. Backfill + migration.

### 14.5. UI/UX
- **Secondary button nhạt nhòa**: dùng viền rõ, nền trắng/dark, chữ đậm.
- **Sticky table column bị tràn**: freeze cột `GD`, `Mã`, `Tên`, `Công nợ` với width cố định.
- **Mobile empty page**: `TransactionList` nằm trong `hidden sm:block`. Fix: thêm `sm:hidden` card view.
- **FAB che nội dung cuối**: `bottom-20` + `pb-36`.
- **Header mobile quá đông**: chuyển company/app switcher/language/profile vào sidebar drawer.
- **Tabs Cài đặt dài**: gộp tab liên quan, dùng grid 2-3-4 cột.
- **Reset UI gây hiểu nhầm**: chỉ 1 nút `Reset`, option `Tất cả` auto-disable các option con.

### 14.6. Database / RLS
- **RLS error "new row violates..."**: thiếu `company_id` trong `upsert` payload. Fix: include `company_id`, `status`, `full_name`, `updated_at`.
- **RLS policy 406**: `.single()` trả `406` khi role không xem được. Fix: `.maybeSingle()`.
- **PostgREST `ilike` special chars**: `,`, `(`, `)`, `.`, `=` gây `PGRST100`. Fix: quote `ilike` value.
- **Migration filename collision**: `034_...` trùng với accounting. Fix: đặt số duy nhất theo thứ tự thực tế (`042_...`).

### 14.7. Deployment / CI
- **Vercel Git auto-deploy spam 7 apps**: quota 100/ngày cạn vì canceled/error. Fix: `git.deploymentEnabled: false` + GitHub Actions `Deploy changed Vercel apps`.
- **Preview branch alias lag**: alias `*-git-viet-...` chưa cập nhật ngay khi READY. Fix: verify direct deployment URL.
- **Domain gọn cho app**: `sales-operation` → `sales`, `hr-operation` → `hr`, `operations-portal` → `ops`.
- **`ignoreCommand` > 256 char**: chuyển logic sang `scripts/vercel-ignore.sh`.

### 14.8. Testing / Dev environment
- **Thiếu test case duplicate `transaction_code`**: lỗi lọt sản phẩm. Fix: thêm unit test.
- **Trial seed không sync balance**: data mẫu `total_balance` phải khớp tổng transactions.
- **Local RLS test**: dùng `supabase-local-from-dump.sh` + `packages/api` mirror trước khi đẩy production.

### 14.9. Search / Filter / Pagination
- **Filter balance `Dư nợ từ/đến`**: server-side `gte/lte` trên `total_balance`, tóm tắt tổng dư nợ.
- **Filter customer trong transaction list**: dropdown chọn khách hàng và sync với URL param.
- **Group-by summary chỉ tính page hiện tại**: phải aggregate trên toàn bộ kết quả filter (max 1,000).
- **Date range theo local time**: dùng local midnight boundaries, không `new Date()`.

### 14.10. Backup / Restore
- **Browser-safe compression**: `pako` có thể không chạy trong browser. Fix: `TextEncoder` + `btoa` hoặc package browser-compatible.
- **Restore không whitelist column**: insert/update toàn bộ cột backup, có thể ghi đè `created_at`/`company_id`. Fix: whitelist + sanitize tenant fields.
- **Restore báo lỗi không rõ**: dùng per-record error + `getErrorMessage`.
