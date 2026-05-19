# SERVICE LAYER MAP

> **Last Updated**: 2026-05-01
> **Note**: The cashflow app does **not** expose a custom REST API. All data operations go through the **Supabase JS client** (`src/services/supabase.ts`) via the service layer exported from `src/services/database.ts`.

---

## `databaseService` exports

| Service | Key Methods | Source Table(s) |
|---------|-------------|-----------------|
| `dashboard` | `getMetrics(branchId?, timeRange?)` | transactions, customers |
| `customers` | `getCustomers(filters?)`, `getCustomerById(id)`, `createCustomer(data)`, `updateCustomer(id, data)`, `deleteCustomer(id)`, `bulkCreateCustomers(rows)` | customers |
| `transactions` | `getTransactions(filters?)`, `createTransaction(data)`, `updateTransaction(id, data)`, `deleteTransaction(id)`, `bulkCreateTransactions(rows)` | transactions |
| `transactionTypes` | `getTransactionTypes()`, `createTransactionType(data)`, `updateTransactionType(id, data)`, `deleteTransactionType(id)` | transaction_types |
| `branches` | `getBranches()`, `createBranch(data)`, `updateBranch(id, data)`, `deleteBranch(id)` | branches |
| `bankAccounts` | `getBankAccounts()`, `createBankAccount(data)`, `updateBankAccount(id, data)`, `deleteBankAccount(id)` | bank_accounts |
| `users` | `getUsers()`, `updateUser(id, data)` | users |
| `colorSettings` | `getTransactionTypeColors()`, `getCustomerBalanceColors()`, `updateTransactionTypeColors(colors)`, `updateCustomerBalanceColors(colors)` | color_settings |
| `backupHistory` | `getBackupHistory()`, `createBackupHistory(data)` | backup_history |
| `reports` | `getReports()` | — |

---

## Permission-gated imports

| Import Entry Point | Service Method | Permission Check |
|--------------------|----------------|------------------|
| CustomerImport (single / bulk) | `customers.createCustomer` / `customers.bulkCreateCustomers` | `canImportCustomers` (RBAC) |
| TransactionImport (single / bulk) | `transactions.createTransaction` / `transactions.bulkCreateTransactions` | `canImportTransactions` (RBAC) |

---

## Auth & user profile

| Operation | Supabase Auth API | App Hook |
|-----------|-------------------|----------|
| Sign in | `supabase.auth.signInWithPassword` | `useAuth().signIn` |
| Sign up | `supabase.auth.signUp` | `useAuth().signUp` |
| Sign out | `supabase.auth.signOut` | `useAuth().signOut` |
| Session | `supabase.auth.getSession` / `onAuthStateChange` | `useAuth()` state |
| Profile | `supabase.from("users").select(...)` | `fetchUserProfile` in `useAuth.ts` |

---

## Edge Functions (if deployed)

| Function | Purpose |
|----------|---------|
| `create-user` | Server-side user record creation after auth sign-up |