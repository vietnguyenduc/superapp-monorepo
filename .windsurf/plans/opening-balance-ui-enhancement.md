# Opening Balance UI Enhancement Plan

## Objective
Add a user-friendly scrollable customer list with inline opening-balance editing to the "Số dư đầu kỳ" tab in Settings, while keeping the existing Excel/CSV import as an alternative option. The UI must show customer info, current opening balance, current total balance, and a live preview of the new total balance when the opening balance is changed.

## Key Technical Constraints
- `customers` table fields: `opening_balance`, `current_balance`, `total_balance`
- Existing `bulkUpdateOpeningBalances` sets `current_balance = opening_balance`, which **drops transaction effects** (bug). To avoid corrupting balances, the new UI must use a delta-based update: `new_current_balance = new_opening + (old_current - old_opening)`.
- Balance formula: `total_balance = opening_balance + charge - payment - refund + adjustment(signed)`.
- All DB operations must filter by `company_id` for multi-tenancy.

## Plan Steps

### Step 1: Add Service Function for Safe Individual Update
**File:** `src/services/database.ts`
- Add `updateCustomerOpeningBalance(id, newOpening, companyId)`:
  1. Fetch the customer row to get `opening_balance` and `current_balance`.
  2. Compute `delta = (old_current_balance ?? 0) - (old_opening_balance ?? 0)`.
  3. Set `new_current_balance = newOpening + delta`.
  4. Update `customers` with `{ opening_balance: newOpening, current_balance: new_current_balance, updated_at: now }`.
  5. Return `{ data, error }`.

### Step 2: Add State & Data Loading for Customer Balances
**File:** `src/pages/Settings/Settings.tsx`
- Add state:
  - `customerBalances: CustomerBalanceRow[]`
  - `customerBalanceSearch: string`
  - `isLoadingCustomerBalances: boolean`
  - `customerBalanceErrors: string[]`
  - `customerBalanceSuccess: string | null`
- Add `loadCustomerBalances()`:
  - Call `databaseService.customers.getCustomers({ limit: 1000, company_id: companyId })`.
  - Map response to `{ id, customer_code, full_name, opening_balance, current_balance, total_balance, new_opening_balance }`.
  - Store in `customerBalances` state.
- Call `loadCustomerBalances()` inside the existing `loadData()` effect.

### Step 3: Build Scrollable Customer List UI
**File:** `src/pages/Settings/Settings.tsx` (JSX inside the `"Số dư đầu kỳ"` tab)
- Add a sub-tab switcher (or an accordion) with two options:
  1. **Nhập nhanh (danh sách)** — the new scrollable list (default)
  2. **Nhập từ file Excel/CSV** — the existing file import
- For the new list view:
  - A search input to filter by `customer_code` or `full_name`.
  - A scrollable table (`max-h-96 overflow-y-auto`) with columns:
    - Mã KH
    - Tên khách hàng
    - Số dư đầu kỳ hiện tại
    - Số dư hiện tại (lấy `total_balance` / `current_balance`)
    - Số dư đầu kỳ mới (inline `<input type="number">`)
    - Số dư mới sau cập nhật (computed preview)
  - Input must format currency (e.g., `1,000,000`) and parse on change.
  - Preview formula: `new_total = new_opening + (current_balance - opening_balance)`.
  - Highlight rows that have been modified.

### Step 4: Add Batch Save Handler
**File:** `src/pages/Settings/Settings.tsx`
- Add `handleSaveCustomerBalances()`:
  1. Filter rows where `new_opening_balance !== opening_balance`.
  2. Validate each row (e.g., `new_opening_balance` is a finite number).
  3. Call `databaseService.customers.updateCustomerOpeningBalance` for each modified row (or build a batch update if desired).
  4. On success, re-run `loadCustomerBalances()` to refresh stale data.
  5. Show toast / inline message for success/error.

### Step 5: Keep Existing File Import as Alternative
**File:** `src/pages/Settings/Settings.tsx`
- Wrap the existing file import JSX inside the second sub-tab/accordion panel.
- Keep all existing handlers (`handleOpeningFile`, `handleImportOpeningBalance`, etc.) unchanged.

### Step 6: Test & Verify Balance Calculations
- Manually test:
  1. Open Settings → Số dư đầu kỳ.
  2. Pick a customer with known transactions.
  3. Change opening balance and verify the preview matches `new_opening + (old_current - old_opening)`.
  4. Save and verify `current_balance` in the DB updated correctly (not just set to `opening_balance`).
  5. Re-run Dashboard/Customer list to confirm displayed balances are still consistent.

## Implementation Order
1. Service layer (safe update function) → 2. State & data loading → 3. Scrollable list UI → 4. Batch save handler → 5. File import fallback integration → 6. Testing

## Files to Modify
- `apps/cashflow/src/services/database.ts`
- `apps/cashflow/src/pages/Settings/Settings.tsx`
