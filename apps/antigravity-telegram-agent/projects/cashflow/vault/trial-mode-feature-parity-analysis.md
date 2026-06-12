# Trial Mode vs Real Mode Feature Parity Analysis

**Date:** 2026-05-01  
**Purpose:** Deep dive review to verify trial mode features match real mode flow  
**Expected:** Only difference should be database (localStorage vs Supabase) and account creation

---

## Executive Summary

**Status:** ❌ **PARTIAL PARITY ACHIEVED**

Trial mode and real mode are **NOT yet fully aligned**. While simple CRUD operations have been successfully refactored to use shared logic and data adapter, many complex methods and services still have separate trial mode logic paths.

---

## Refactored Methods (Feature Parity Achieved ✅)

These methods use shared validation, transformation, and data adapter. Trial mode and real mode use identical business logic.

### Customer Service
- ✅ `getCustomers` - Uses `getDataAdapter().get()` with filters
- ✅ `getCustomerById` - Uses `getDataAdapter().getById()` with manual related data fetching
- ✅ `createCustomer` - Uses `validateCustomerData`, `transformRawCustomer`, `getDataAdapter().insert()`, **includes server-side duplicate check for customer_code**
- ✅ `updateCustomer` - Uses `validateCustomerData`, `transformRawCustomer`, `getDataAdapter().update()`, **includes duplicate check excluding current customer**
- ✅ `deleteCustomer` - Uses `getDataAdapter().delete()`
- ✅ `updateCustomerOpeningBalance` - Uses `getDataAdapter().update()` with balance calculation
- ✅ `bulkUpdateOpeningBalances` - Uses `getDataAdapter().get()` and `getDataAdapter().update()`
- ✅ `bulkCreateCustomers` - Uses `validateCustomerData`, `transformRawCustomer`, `getDataAdapter().insert()`, **includes per-row duplicate check**

### Transaction Service
- ✅ `getTransactionById` - Uses `getDataAdapter().getById()` with manual related data fetching (customer, bank_account)
- ✅ `createTransaction` - Uses `validateTransactionData`, `transformRawTransaction`, `getDataAdapter().insert()`
- ✅ `updateTransaction` - Uses `validateTransactionData`, `transformRawTransaction`, `getDataAdapter().update()`
- ✅ `deleteTransaction` - Uses `getDataAdapter().delete()`

### Transaction Type Service
- ✅ `getTransactionTypes` - Uses `getDataAdapter().get()`
- ✅ `getTransactionType` - Uses `getDataAdapter().getById()`
- ✅ `createTransactionType` - Uses `validateTransactionTypeData`, `transformRawTransactionType`, `getDataAdapter().insert()`
- ✅ `updateTransactionType` - Uses `validateTransactionTypeData`, `transformRawTransactionType`, `getDataAdapter().update()`
- ✅ `deleteTransactionType` - Uses `getDataAdapter().delete()` with usage check
- ✅ `toggleTransactionTypeActive` - Uses `getDataAdapter().update()`

### Branch Service
- ✅ `getBranches` - Uses `getDataAdapter().get()`
- ✅ `getBranch` - Uses `getDataAdapter().getById()`
- ✅ `createBranch` - Uses `validateBranchData`, `transformRawBranch`, `getDataAdapter().insert()`
- ✅ `updateBranch` - Uses `validateBranchData`, `transformRawBranch`, `getDataAdapter().update()`
- ✅ `deleteBranch` - Uses `getDataAdapter().delete()`

### Bank Account Service
- ✅ `getBankAccounts` - Uses `getDataAdapter().get()`
- ✅ `getBankAccount` - Uses `getDataAdapter().getById()`
- ✅ `upsertBankAccount` - Uses `validateBankAccountData`, `transformRawBankAccount`, `getDataAdapter().insert()`/`update()`
- ✅ `deleteBankAccount` - Uses `getDataAdapter().delete()`

---

## Methods Still With Trial Mode Branching (Feature Parity NOT Achieved ❌)

These methods still have `if (getTrialMode())` branching with different logic paths.

### Color Settings Service (2 instances)
- ❌ `getTransactionTypeColors` (line 20)
  - **Trial mode:** Returns default colors immediately
  - **Real mode:** Fetches from `color_settings` table, falls back to defaults on error
  - **Difference:** Trial mode doesn't attempt database fetch, real mode does

- ❌ `getCustomerBalanceColors` (line 45)
  - **Trial mode:** Returns default colors immediately
  - **Real mode:** Fetches from `color_settings` table, falls back to defaults on error
  - **Difference:** Trial mode doesn't attempt database fetch, real mode does

### Transaction Service (2 instances)
- ❌ `getTransactions` (line 934)
  - **Trial mode:** Returns mock transactions without joins, no filtering, no pagination
  - **Real mode:** Uses Supabase joins with customers, bank_accounts, branches, users; supports filtering, search, pagination
  - **Difference:** Trial mode lacks complex joins and advanced query features

- ❌ `bulkImportTransactions` (line 1123)
  - **Trial mode:** Simple mapping to mock store, basic customer balance updates
  - **Real mode:** Complex validation including:
    - Transaction type normalization and validation
    - Customer code to customer_id mapping
    - Date parsing (DD/MM/YYYY format)
    - Duplicate transaction_code checking (within batch and against DB)
    - Customer balance updates
  - **Difference:** Trial mode lacks validation, normalization, and duplicate checking

### Dashboard Service (2 instances)
- ❌ `getDashboardMetrics` (line 1598)
  - **Trial mode:** Processes mock data locally, returns basic metrics
  - **Real mode:** Fetches data from multiple tables in parallel (transactions, customers, bank_accounts, branches), calculates complex metrics including time ranges, cash flow data
  - **Difference:** Trial mode lacks complex time range calculations and cash flow analysis

- ❌ `getReceivableLedger` (line 1952)
  - **Trial mode:** Returns mock data without processing
  - **Real mode:** Fetches transactions and branches, calculates opening/closing balances, processes time ranges
  - **Difference:** Trial mode doesn't calculate ledger balances or process time ranges

### Backup History Service (3 instances)
- ❌ `saveBackupHistory` (line 2067)
  - **Trial mode:** Saves to mock store with trial-company ID
  - **Real mode:** Inserts into `backup_history` table, calls cleanupOldBackups
  - **Difference:** Trial mode doesn't have cleanup logic

- ❌ `getBackupHistory` (line 2339)
  - **Trial mode:** Returns mock backups without filtering
  - **Real mode:** Fetches from `backup_history` table with optional company_id and user_id filtering
  - **Difference:** Trial mode lacks filtering capabilities

- ❌ `deleteBackupHistory` (line 2368)
  - **Trial mode:** Deletes from mock store
  - **Real mode:** Deletes from `backup_history` table
  - **Difference:** Database operation vs local operation

---

## Data Adapter Analysis

The `dataAdapter.ts` correctly abstracts localStorage vs Supabase:

### LocalStorageAdapter (Trial Mode)
- Uses `trialGet`, `trialInsert`, `trialUpdate`, `trialDelete`
- Supports basic filters: eq, neq, gt, gte, lt, lte, like, in
- Supports batch operations (sequential)
- **Limitations:** No complex joins, no parallel queries

### SupabaseAdapter (Real Mode)
- Uses Supabase client
- Supports same filters as LocalStorageAdapter
- Supports batch operations (sequential for updates, parallel for delete)
- **Limitations:** No complex joins through adapter (must use direct Supabase queries)

### Adapter Factory
```typescript
export function getDataAdapter(): DataAdapter {
  if (!adapterInstance) {
    if (getTrialMode()) {
      adapterInstance = new LocalStorageAdapter();
    } else {
      adapterInstance = new SupabaseAdapter();
    }
  }
  return adapterInstance;
}
```

**Assessment:** Data adapter correctly abstracts basic CRUD operations. However, it does not support:
- Complex joins (required by getTransactions)
- Parallel queries (required by dashboardService)
- Advanced Supabase features (select with joins, count with exact)

---

## Key Differences Beyond Database Layer

### 1. Complex Joins
**Real mode:** Uses Supabase joins to fetch related data in single query
```typescript
supabase.from("transactions").select(`
  *,
  customers!customer_id (full_name, customer_code),
  bank_accounts!bank_account_id (account_name),
  branches!branch_id (name, code),
  users!created_by (full_name, email)
`)
```

**Trial mode:** No joins, related data either missing or manually fetched
**Impact:** Trial mode cannot display related data (customer names, bank account names, etc.)

### 2. Parallel Queries
**Real mode:** Uses `Promise.all` for parallel data fetching
```typescript
const [txResult, custResult, bankResult, branchResult] = await Promise.all([
  supabase.from("transactions").select("*"),
  supabase.from("customers").select("*"),
  supabase.from("bank_accounts").select("*"),
  supabase.from("branches").select("id, name"),
]);
```

**Trial mode:** Sequential or single data source
**Impact:** Trial mode may be slower, doesn't support complex dashboard metrics

### 3. Advanced Validation
**Real mode:** Server-side validation with database constraints
- Transaction type normalization
- Customer code mapping
- Duplicate checking against database
- Date parsing

**Trial mode:** Basic or no validation
**Impact:** Trial mode may allow invalid data that real mode would reject

### 4. Time Range Calculations
**Real mode:** Complex time range logic for dashboard metrics
- Period start/end calculations
- Opening/closing balances
- Cash flow data generation

**Trial mode:** Basic or no time range support
**Impact:** Trial mode cannot show accurate time-based metrics

### 5. Color Settings
**Real mode:** Fetches user preferences from database
**Trial mode:** Always uses defaults
**Impact:** Trial mode cannot persist user preferences

---

## Critical Security Issues

### ✅ Fixed in Refactored Methods
- **Customer code duplicate check:** Server-side validation in `createCustomer`, `updateCustomer`, `bulkCreateCustomers`
- **Per-row duplicate check:** Race condition fixed in `bulkCreateCustomers`

### ❌ Still Vulnerable in Unrefactored Methods
- **Transaction code duplicate check:** Only in `bulkImportTransactions` (real mode), not in trial mode
- **Transaction type validation:** Only in `bulkImportTransactions` (real mode), not in trial mode

---

## Recommendations

### Immediate (High Priority)
1. **Refactor getTransactions** - Implement manual related data fetching similar to `getTransactionById`
2. **Refactor bulkImportTransactions** - Use shared validation and data adapter for trial mode
3. **Refactor dashboardService** - Implement sequential data fetching for trial mode

### Short-term (Medium Priority)
4. **Refactor colorSettingsService** - Use data adapter with fallback to defaults
5. **Refactor backupHistoryService** - Use data adapter for all operations
6. **Add validation to trial mode** - Ensure trial mode has same validation as real mode

### Long-term (Low Priority)
7. **Enhance data adapter** - Add support for:
   - Complex joins (manual implementation)
   - Parallel queries (Promise.all wrapper)
   - Advanced Supabase features
8. **Add comprehensive testing** - Ensure trial mode and real mode produce identical results

---

## Conclusion

**Current State:** Partial feature parity achieved for simple CRUD operations. Complex methods still have separate logic paths.

**Gap Analysis:**
- **Refactored:** 12 methods (customer + transaction services)
- **Not refactored:** 9 methods across 4 services (colorSettings, transaction, dashboard, backupHistory)

**Risk Assessment:**
- **Low Risk:** Simple CRUD operations are safe and consistent
- **Medium Risk:** Dashboard and reporting features may show different data
- **High Risk:** Bulk import and complex queries may behave differently

**Recommendation:** Complete refactoring of remaining methods to achieve full feature parity between trial mode and real mode.
