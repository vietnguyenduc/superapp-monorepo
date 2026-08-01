// Shared Transformation Functions
// Pure functions for transforming data - no data source dependencies

// Generates a collision-resistant id for the real (non-trial) data path.
// Uses ms timestamp + 8 random chars — avoids crypto.randomUUID() so it works
// on non-secure contexts (e.g. dev over plain Tailscale HTTP).
const genId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

// Customer Transformation
export function transformRawCustomer(raw: any, useUuidId = false): any {
  const now = new Date().toISOString();
  return {
    id: raw.id || (useUuidId ? genId("cust") : `cust-${Date.now()}`),
    customer_code: raw.customer_code || `CUST${Date.now().toString().slice(-4)}`,
    full_name: raw.full_name,
    phone: raw.phone || null,
    email: raw.email || null,
    address: raw.address || null,
    nguoi_dai_dien: raw.nguoi_dai_dien || null,
    opening_balance: raw.opening_balance ?? 0,
    total_balance: raw.total_balance ?? 0,
    company_id: raw.company_id ?? null,
    branch_id: raw.branch_id ?? null,
    created_at: raw.created_at || now,
    updated_at: raw.updated_at || now,
  };
}

// Transaction Transformation
export function transformRawTransaction(raw: any, useUuidId = false): any {
  const now = new Date().toISOString();
  return {
    id: raw.id || (useUuidId ? genId("txn") : `txn-${Date.now()}`),
    transaction_code: raw.transaction_code || `TXN${Date.now()}`,
    customer_id: raw.customer_id || null,
    bank_account_id: raw.bank_account_id || null,
    branch_id: raw.branch_id || null,
    transaction_type: raw.transaction_type,
    amount: raw.amount,
    description: raw.description || null,
    transaction_date: raw.transaction_date || now,
    created_by: raw.created_by || null,
    created_at: raw.created_at || now,
    updated_at: raw.updated_at || now,
  };
}

// Bank Account Transformation
export function transformRawBankAccount(raw: any, useUuidId = false): any {
  const now = new Date().toISOString();
  return {
    id: raw.id || (useUuidId ? genId("bank") : `bank-${Date.now()}`),
    account_name: raw.account_name,
    account_number: raw.account_number,
    bank_name: raw.bank_name,
    balance: raw.balance ?? 0,
    is_active: raw.is_active !== false,
    branch_id: raw.branch_id ?? null,
    company_id: raw.company_id ?? null,
    created_at: raw.created_at || now,
    updated_at: raw.updated_at || now,
  };
}

// Branch Transformation
export function transformRawBranch(raw: any, useUuidId = false): any {
  const now = new Date().toISOString();
  return {
    id: raw.id || (useUuidId ? genId("branch") : `branch-${Date.now()}`),
    name: raw.name,
    code: raw.code,
    logo_url: raw.logo_url || null,
    is_active: raw.is_active !== false,
    company_id: raw.company_id ?? null,
    created_at: raw.created_at || now,
    updated_at: raw.updated_at || now,
  };
}

// Transaction Type Transformation
export function transformRawTransactionType(raw: any, useUuidId = false): any {
  const now = new Date().toISOString();
  return {
    id: raw.id || (useUuidId ? genId("type") : `type-${Date.now()}`),
    name: raw.name.trim(),
    color: raw.color || "blue",
    math_factor: raw.math_factor ?? 1,
    impact_type: raw.impact_type || "increase",
    is_active: raw.is_active !== false,
    company_id: raw.company_id ?? null,
    created_at: raw.created_at || now,
    updated_at: raw.updated_at || now,
  };
}

// Backup History Transformation
export function transformRawBackupHistory(raw: any): any {
  const now = new Date().toISOString();
  return {
    id: raw.id || `backup-${Date.now()}`,
    company_id: raw.company_id ?? null,
    backup_name: raw.backup_name || `Backup ${now}`,
    backup_version: raw.backup_version || "1.0.0",
    backup_timestamp: raw.backup_timestamp || now,
    backup_format: raw.backup_format || "xlsx",
    backup_size: raw.backup_size,
    created_by: raw.created_by,
    total_customers: raw.metadata?.totalCustomers || 0,
    total_transactions: raw.metadata?.totalTransactions || 0,
    total_bank_accounts: raw.metadata?.totalBankAccounts || 0,
    total_branches: raw.metadata?.totalBranches || 0,
    branch_id: raw.branch_id ?? null,
    notes: raw.notes,
    is_restorable: true,
    created_at: now,
  };
}
