// Shared Transformation Functions
// Pure functions for transforming data - no data source dependencies

import { parseAmount } from "./parsers";

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

const strOrNull = (value: unknown) => {
  const s = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  return s || null;
};

const strOrDefault = (value: unknown, fallback: string) => {
  const s = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  return s || fallback;
};

// Customer Transformation
export function transformRawCustomer(raw: Record<string, unknown>): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    id: strOrDefault(raw.id, genId("cust")),
    customer_code: strOrDefault(raw.customer_code, `CUST${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
    full_name: strOrDefault(raw.full_name, ""),
    phone: strOrNull(raw.phone),
    email: strOrNull(raw.email),
    address: strOrNull(raw.address),
    nguoi_dai_dien: strOrNull(raw.nguoi_dai_dien),
    opening_balance: parseAmount(raw.opening_balance ?? 0),
    total_balance: parseAmount(raw.total_balance ?? 0),
    company_id: strOrNull(raw.company_id),
    branch_id: strOrNull(raw.branch_id),
    created_at: strOrDefault(raw.created_at, now),
    updated_at: strOrDefault(raw.updated_at, now),
  };
}

// Transaction Transformation
export function transformRawTransaction(raw: Record<string, unknown>): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    id: strOrDefault(raw.id, genId("txn")),
    transaction_code: strOrDefault(raw.transaction_code, `TXN${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
    customer_id: strOrNull(raw.customer_id),
    customer_name: strOrNull(raw.customer_name),
    bank_account_id: strOrNull(raw.bank_account_id),
    bank_account_name: strOrNull(raw.bank_account_name),
    branch_id: strOrNull(raw.branch_id),
    company_id: strOrNull(raw.company_id),
    transaction_type: strOrDefault(raw.transaction_type, ""),
    amount: parseAmount(raw.amount ?? 0),
    description: strOrNull(raw.description),
    reference_number: strOrNull(raw.reference_number),
    transaction_date: strOrDefault(raw.transaction_date, now),
    status: strOrDefault(raw.status, "completed"),
    created_by: strOrNull(raw.created_by),
    created_at: strOrDefault(raw.created_at, now),
    updated_at: strOrDefault(raw.updated_at, now),
  };
}

// Bank Account Transformation
export function transformRawBankAccount(raw: Record<string, unknown>): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    id: strOrDefault(raw.id, genId("bank")),
    account_name: strOrDefault(raw.account_name, ""),
    account_number: strOrDefault(raw.account_number, ""),
    bank_name: strOrDefault(raw.bank_name, ""),
    balance: parseAmount(raw.balance ?? 0),
    is_active: raw.is_active !== false,
    branch_id: strOrNull(raw.branch_id),
    company_id: strOrNull(raw.company_id),
    created_at: strOrDefault(raw.created_at, now),
    updated_at: strOrDefault(raw.updated_at, now),
  };
}

// Branch Transformation
export function transformRawBranch(raw: Record<string, unknown>): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    id: strOrDefault(raw.id, genId("branch")),
    name: strOrDefault(raw.name, ""),
    code: strOrDefault(raw.code, ""),
    logo_url: strOrNull(raw.logo_url),
    is_active: raw.is_active !== false,
    company_id: strOrNull(raw.company_id),
    created_at: strOrDefault(raw.created_at, now),
    updated_at: strOrDefault(raw.updated_at, now),
  };
}

// Transaction Type Transformation
export function transformRawTransactionType(raw: Record<string, unknown>): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    id: strOrDefault(raw.id, genId("type")),
    name: strOrDefault(raw.name, "").trim(),
    color: strOrDefault(raw.color, "blue"),
    math_factor: parseAmount(raw.math_factor ?? 1),
    impact_type: strOrDefault(raw.impact_type, "increase"),
    is_active: raw.is_active !== false,
    company_id: strOrNull(raw.company_id),
    created_at: strOrDefault(raw.created_at, now),
    updated_at: strOrDefault(raw.updated_at, now),
  };
}

// Backup History Transformation
export function transformRawBackupHistory(raw: Record<string, unknown>): Record<string, unknown> {
  const now = new Date().toISOString();
  const metadata = raw.metadata as Record<string, unknown> | undefined;
  return {
    id: strOrDefault(raw.id, genId("backup")),
    company_id: strOrNull(raw.company_id),
    backup_name: strOrDefault(raw.backup_name, `Backup ${now}`),
    backup_version: strOrDefault(raw.backup_version, "1.0.0"),
    backup_timestamp: strOrDefault(raw.backup_timestamp, now),
    backup_format: strOrDefault(raw.backup_format, "xlsx"),
    backup_size: parseAmount(raw.backup_size ?? 0),
    created_by: strOrNull(raw.created_by),
    total_customers: parseAmount(metadata?.totalCustomers ?? 0),
    total_transactions: parseAmount(metadata?.totalTransactions ?? 0),
    total_bank_accounts: parseAmount(metadata?.totalBankAccounts ?? 0),
    total_branches: parseAmount(metadata?.totalBranches ?? 0),
    branch_id: strOrNull(raw.branch_id),
    notes: strOrNull(raw.notes),
    is_restorable: true,
    created_at: now,
  };
}
