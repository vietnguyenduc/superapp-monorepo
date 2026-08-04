// Shared Transformation Functions
// Pure functions for transforming data - no data source dependencies

// Generates a collision-resistant id for the real (non-trial) data path.
// Uses ms timestamp + 8 random chars — avoids crypto.randomUUID() so it works
// on non-secure contexts (e.g. dev over plain Tailscale HTTP).
const genId = (prefix: string) => {
  const random =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`;
  return `${prefix}-${random}`;
};

// Customer Transformation
export function transformRawCustomer(raw: any, useUuidId = false): any {
  const now = new Date().toISOString();
  return {
    id: raw.id || genId("cust"),
    customer_code: raw.customer_code || `CUST${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
    id: raw.id || genId("txn"),
    transaction_code: raw.transaction_code || `TXN${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    customer_id: raw.customer_id || null,
    customer_name: raw.customer_name || null,
    bank_account_id: raw.bank_account_id || null,
    bank_account_name: raw.bank_account_name || null,
    branch_id: raw.branch_id || null,
    company_id: raw.company_id || null,
    transaction_type: raw.transaction_type,
    amount: raw.amount,
    description: raw.description || null,
    reference_number: raw.reference_number || null,
    transaction_date: raw.transaction_date || now,
    status: raw.status || "completed",
    created_by: raw.created_by || null,
    created_at: raw.created_at || now,
    updated_at: raw.updated_at || now,
  };
}

// Bank Account Transformation
export function transformRawBankAccount(raw: any, useUuidId = false): any {
  const now = new Date().toISOString();
  return {
    id: raw.id || genId("bank"),
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
    id: raw.id || genId("branch"),
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
    id: raw.id || genId("type"),
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
    id: raw.id || genId("backup"),
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
