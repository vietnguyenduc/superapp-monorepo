# Plan: Thêm loại giao dịch "Đặt cọc" (deposit) cho Cashflow

> Scope: `apps/cashflow`. Plan phase — chưa code, đợi duyệt mới triển khai.
> Nhánh thực hiện: tách riêng `devin/cashflow-deposit` từ `main`, không đụng đến nhánh `devin/current-feature` đang chứa framework-method.

## 1. Định nghĩa loại giao dịch mới

- **Canonical ID:** `deposit`
- **Tên hiển thị (VI):** `Đặt cọc`
- **Tên hiển thị (EN):** `Deposit / Prepayment`
- **Tính chất theo yêu cầu:** giống `payment` / "Phát sinh giảm" → **làm giảm công nợ khách hàng**.
- **Màu đề xuất:** badge `purple` (`#8b5cf6`, `bg-purple-100 text-purple-800`), còn số tiền vẫn hiển thị màu xanh khi số dương vì delta giảm nợ.

## 2. Giả định cần bạn xác nhận trước khi code

1. **Tiền đặt cọc có vào tài khoản ngân hàng không?**
   - Giả định của plan: **CÓ** — `getBankAccountBalanceDelta` trả về `+amount`, giống `payment`.
   - Nếu đặt cọc chỉ là công nợ âm mà không chạm tiền mặt, cần để bank delta = `0`.
2. **Màu badge bạn muốn là gì?** Đề xuất `purple` để phân biệt với `payment` xanh.
3. **Dashboard / báo cáo:**
   - Gộp `deposit` vào số lượng/cột "Thu / Phát sinh giảm" (đơn giản) hay tách riêng "Đặt cọc"?
   - Gộp thì ít thay đổi UI; tách thì cần thêm cột/số liệu mới.
4. **Tên tiếng Anh:** `Deposit` hay `Prepayment`?

## 3. Blast radius — những chỗ cần đụng đến

| Layer | Files | Thay đổi chính |
|-------|-------|----------------|
| **DB / migrations** | `supabase/migrations/0XX_add_deposit_transaction_type.sql` | Thêm giá trị `deposit` cho enum `transaction_type`; seed row `deposit` vào `transaction_types` cho mỗi company; xử lý `color_settings` để có màu `deposit`. |
| **Kiểu dữ liệu** | `apps/cashflow/src/types/index.ts` | `TransactionType` union thêm `"deposit"`. |
| **Balance math (single source of truth)** | `services/businessLogic/balanceMath.ts` | `getCustomerBalanceDelta` trả `+amount` cho `deposit`; `getBankAccountBalanceDelta` trả `+amount` (giả định có vào ngân hàng). |
| **Validation** | `services/businessLogic/validation.ts` | `validTypes` trong `validateTransactionData` / `validateTransactionUpdateData` thêm `"deposit"`. |
| **Parser / normalization** | `services/businessLogic/parsers.ts`, `utils/dataCleaning.ts`, `utils/importUtils.ts` | Map các alias `đặt cọc`, `dat coc`, `coc`, `deposit`, ... về `"deposit"`; cập nhật `VALID_TRANSACTION_TYPES`, `cleanTransactionType`. |
| **Constants** | `utils/constants.ts` | `TRANSACTION_TYPES.DEPOSIT = "deposit"`. |
| **UI labels** | `contexts/TransactionTypeContext.tsx` | `CANONICAL_TYPE_LABELS` thêm `deposit: "Đặt cọc"` + alias; **sửa `getNameById` để fallback theo canonical name** (do `transaction_types.id` là UUID, còn `transaction_type` lưu canonical). |
| **Colors** | `services/colorSettingsService.ts`, `utils/formatting.ts` | Thêm `deposit` vào default colors; fallback trong `getTransactionTypeColor` / `getTransactionTypeTextColor`. Đọc `color_settings` merge với defaults để cũ tự động có `deposit`. |
| **Transaction list & edit** | `pages/Transactions/TransactionList.tsx`, `TransactionEditModal.tsx` | Dropdown dùng **canonical name** làm `value`, không dùng UUID; fallback thêm `deposit`; group summary hiện `deposit` vào cột giảm nợ (hoặc tách cột nếu bạn chọn). |
| **Import** | `pages/DataImport/TransactionImport.tsx`, `utils/importUtils.ts` | Cho phép `deposit` trong validation/template; đảm bảo import `đặt cọc` / `dat coc` / `deposit` đều nhận. |
| **Dashboard** | `services/dashboardService.ts` | `currentIncome` tự động tính `deposit` vì dùng `getCustomerBalanceDelta`; cần quyết định có tách count `deposit` ra khỏi `transactionPaymentCount`. |
| **Customer detail / Recent transactions** | `pages/Customers/CustomerDetail.tsx`, `CustomerDetailModal.tsx`, `pages/Dashboard/components/RecentTransactions.tsx` | Chỉ cần context + color đúng là tự động hiển thị đúng. |
| **Reports** | `pages/Reports/components/ReportPreview.tsx` | Cần key i18n `transactions.types.deposit` để báo cáo nhóm theo loại hiển thị tên. |
| **i18n** | `src/i18n/locales/vi.json`, `en.json` | Thêm `deposit` vào các object `transactions.types` (có 3 chỗ trong `vi.json`, 2 chỗ trong `en.json`) và `transactions.deposit` nếu cần. |
| **Settings** | `pages/Settings/components/tabs/TransactionTypesTab.tsx` | Có thể tạo/sửa `deposit` như các loại khác; sửa `transactionTypeService.toggle/delete` để check `transaction_type` theo `name` thay vì `id` (UUID) khi kiểm tra có đang dùng. |
| **Trial seed** | `services/trialMockStore.ts` | Thêm row `deposit` vào seed `transaction_types`. |
| **Tests** | `__tests__/transactionTypeNames.test.tsx`, `services/businessLogic/__tests__/balanceMath.test.ts`, `services/businessLogic/__tests__/validation.test.ts`, `utils/__tests__/importUtils.test.ts`, `utils/__tests__/constants.test.ts`, `utils/__tests__/dataCleaning.test.ts`, `services/__tests__/transactionBalanceSync.test.ts`, `services/__tests__/dashboardMetrics.test.ts`, `utils/__tests__/formatting.test.ts` | Thêm case `deposit`. |
| **Docs** | `docs/AI-CONTEXT.md`, `docs/DATA-FLOW.md`, `docs/CHANGELOG.md` | Cập nhật bảng loại giao dịch, sign convention, changelog. |

## 4. Kiến trúc cần chú ý

### 4.1 `transaction_type` column — enum hay text?
- Migration `001_initial_schema.sql` tạo `CREATE TYPE transaction_type AS ENUM ('payment', 'charge', 'adjustment', 'refund')`.
- Migration `010_transaction_type_constraints.sql` nhắc enum vs UUID `transaction_types.id` không tương thích, nên app tự enforce.
- Để an toàn, sẽ thêm migration **idempotent** kiểm tra `pg_enum` rồi `ALTER TYPE transaction_type ADD VALUE 'deposit'`, tránh lỗi khi chạy lại hoặc khi column đã bị đổi sang `text` ở production.

### 4.2 `transaction_types.id` UUID vs canonical value
- `transaction_types.id` là UUID; `name` mới là canonical (`payment`, `charge`, ...).
- `transactions.transaction_type` lưu canonical (`payment`, `charge`, ...).
- Hiện tại `TransactionTypeContext.getNameById` chỉ tìm theo `id` nên khi gọi `getNameById("payment")` sẽ không tìm thấy UUID → trả về `"payment"` raw. Để `Đặt cọc` hiển thị đúng, cần:
  - Sửa `getNameById` tìm theo cả `id` và `name`, và fallback qua `CANONICAL_TYPE_LABELS`.
  - `TransactionList` / `TransactionEditModal` dùng **canonical `name`** làm option `value`, không dùng UUID.
- Đây là fix ảnh hưởng đến mọi loại giao dịch, không chỉ `deposit`, nhưng cần thiết để deposit hiển thị đúng.

### 4.3 `transactionTypeService.toggle/delete` đang check sai key
- Hiện `toggleTransactionType(id)` và `deleteTransactionType(id)` query `transactions.transaction_type = id` (UUID). Vì `transaction_type` lưu canonical, check này luôn sai → có thể xóa/vô hiệu hóa loại đang dùng.
- Sửa thành check theo `name` (canonical) hoặc theo cả `id` + `name`.

## 5. Chi tiết code changes dự kiến

### 5.1 `balanceMath.ts`
```ts
// getCustomerBalanceDelta
switch (type) {
  case "charge": return -magnitude * sign;
  case "payment":
  case "refund":
  case "deposit": return magnitude * sign;     // giảm công nợ
  case "adjustment":
  default: return signed;
}

// getBankAccountBalanceDelta (giả định deposit vào ngân hàng)
switch (type) {
  case "payment":
  case "deposit": return magnitude * sign;     // tiền vào
  case "refund": return -magnitude * sign;
  case "charge": return 0;
  default: return signed;
}
```

### 5.2 `types/index.ts`
```ts
export type TransactionType = "payment" | "charge" | "adjustment" | "refund" | "deposit";
```

### 5.3 `validation.ts`
```ts
const validTypes = ["payment", "charge", "refund", "adjustment", "deposit"];
```

### 5.4 `parsers.ts` — `normalizeTransactionType`
Thêm block đầu tiên (trước `payment`) để `đặt cọc` không bị nhầm:
```ts
if (["deposit", "đặt cọc", "dat coc", "cọc", "coc", "đặt cọc trước", "tạm ứng", "tam ung"].includes(normalized)) {
  return "deposit";
}
```

### 5.5 `TransactionTypeContext.tsx`
- `CANONICAL_TYPE_LABELS` thêm `deposit` + alias không dấu.
- `getNameById`:
```ts
const getNameById = useCallback((id: string) => {
  if (!id) return id;
  const found = types.find((t) => t.id === id) || types.find((t) => t.name.toLowerCase() === id.toLowerCase());
  if (found) return resolveTransactionTypeDisplayName(found.id, found.name);
  return resolveTransactionTypeDisplayName(id, id);
}, [types]);
```

### 5.6 `formatting.ts` fallback colors
Thêm `case "deposit":` trong `getTransactionTypeColor` và `getTransactionTypeTextColor` với màu tím.

### 5.7 `colorSettingsService.ts`
- `getDefaultTransactionTypeColors` thêm `deposit`.
- `getTransactionTypeColors` merge defaults với `setting_value` đã lưu, thay vì trả về `setting_value` thuần; như vậy production có `color_settings` cũ vẫn tự động thấy `deposit`.

### 5.8 `TransactionEditModal.tsx` fallback
```ts
{ id: "deposit", name: t("transactions.types.deposit") },
```

### 5.9 `TransactionList.tsx`
- Khi load `transactionTypes`, map `id` = canonical `name` (DB), `name` = label từ `getTransactionTypeName(canonical)`.
- Group summary: `delta > 0` (giảm nợ) tiếp tục cộng vào `decrease`; nếu muốn tách cột `deposit` thì thêm field `deposit` vào `GroupSummary` và render cột mới.

### 5.10 `i18n`
Thêm vào tất cả object `transactions.types`:
- `vi`: `"deposit": "Đặt cọc"`
- `en`: `"deposit": "Deposit"` (hoặc `Prepayment` tùy confirm)

### 5.11 `trialMockStore.ts`
Thêm seed:
```ts
{
  id: "deposit",
  name: "Đặt cọc",
  math_factor: -1,
  impact_type: "decrease",
  color: "#8b5cf6",
  is_active: true,
  company_id: null,
}
```

### 5.12 `importUtils.ts`
- `VALID_TRANSACTION_TYPES` thêm `"deposit"`.
- Legacy fallback `validTypes` thêm `"deposit"`.

### 5.13 `dataCleaning.ts`
- `typeMap` thêm `deposit`/`đặt cọc`/`dat coc`/`coc`.

### 5.14 `constants.ts`
- `TRANSACTION_TYPES.DEPOSIT = "deposit"`.

## 6. Supabase migration (tentative `supabase/migrations/0XX_add_deposit_transaction_type.sql`)

```sql
-- 1. Thêm giá trị 'deposit' vào enum transaction_type (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'transaction_type' AND e.enumlabel = 'deposit'
  ) THEN
    ALTER TYPE transaction_type ADD VALUE 'deposit';
  END IF;
END $$;

-- 2. Tạo transaction type 'deposit' cho mọi company đang có
INSERT INTO public.transaction_types (company_id, name, color, math_factor, impact_type, is_active)
SELECT c.id, 'deposit', 'purple', -1, 'decrease', true
FROM public.companies c
ON CONFLICT (company_id, name) DO NOTHING;

-- 3. (Tùy chọn) Nếu không muốn merge defaults trong code, update row color_settings hiện có để thêm deposit
-- UPDATE public.color_settings SET setting_value = setting_value || '{"deposit": {...}}'::jsonb WHERE setting_key = 'transaction_type_colors';
```

Nếu `transaction_type` column đã là `text`, đoạn `ALTER TYPE` vẫn an toàn vì enum vẫn tồn tại; thêm giá trị vào enum không ảnh hưởng đến column text. Nếu column vẫn là enum, đoạn trên bắt buộc.

## 7. Test plan

- **`balanceMath.test.ts`**: `deposit` +100 → customer +100, bank +100; `deposit` -100 → customer -100, bank -100.
- **`validation.test.ts`**: `deposit` hợp lệ; `unknown` vẫn bị từ chối.
- **`importUtils.test.ts`**: parse `đặt cọc` / `dat coc` / `deposit` → `deposit`; validation cho phép.
- **`transactionTypeNames.test.tsx`**: `getNameById("deposit")` trả `"Đặt cọc"`; `getNameById("DEPOSIT ")` ignore case.
- **`transactionBalanceSync.test.ts`**: tạo giao dịch `deposit` → customer balance giảm đúng, bank account balance tăng đúng (nếu confirm bank +).
- **`dashboardMetrics.test.ts`**: `deposit` tính vào `currentIncome` và không tính vào `currentDebt`.
- **`formatting.test.ts`**: color của `deposit` đúng màu tím/xanh.
- **Local preview**: Tạo giao dịch `Đặt cọc` từ UI, import file, xem Dashboard/Customer detail/Transaction list/Báo cáo.

## 8. Deploy & branch plan

1. Tạo nhánh `devin/cashflow-deposit` từ `main` (hoặc `origin/main`).
2. Commit cục bộ từng nhóm file; build/type-check (`npm run type-check -w cashflow`, `npm run build -w cashflow`).
3. Chạy `npm run test -w cashflow`.
4. Local preview trên `http://<TAILSCALE_IP>:5174` (local Vite WSL).
5. Sau khi bạn duyệt local, deploy preview bằng `VERCEL_TOKEN=xxx scripts/deploy-app.sh cashflow preview` (hoặc push lên `viet` tùy workflow) để bạn kiểm tra preview URL.
6. Mở **1 PR duy nhất** `devin/cashflow-deposit` → `main`.
7. Merge → Vercel production `cashflow.appforyou.xyz`.

`framework-method` trên `devin/current-feature` vẫn giữ nguyên, chỉ push khi bạn test xong local preview.

## 9. Câu hỏi cần bạn trả lời để tôi bắt đầu

1. **Đặt cọc có tính là tiền vào tài khoản ngân hàng không?** (Yes → bank +amount; No → bank 0)
2. **Màu badge bạn chọn?** (`purple` đề xuất, hoặc `orange`/`teal`/...)
3. **Dashboard/transaction list group summary:** gộp `deposit` vào "Phát sinh giảm" hay tách cột "Đặt cọc"?
4. **Tên tiếng Anh:** `Deposit` hay `Prepayment`?

Sau khi bạn confirm 4 câu trên, tôi sẽ bắt đầu code theo plan này.
