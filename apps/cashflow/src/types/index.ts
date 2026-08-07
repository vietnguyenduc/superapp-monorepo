import React from "react";

export interface StaffPermissions {
  import_customers?: boolean;
  import_transactions?: boolean;
  add_transaction_only?: boolean;
  no_edit_transaction?: boolean;
  edit_settings?: boolean;
  view_reports?: boolean;
  manage_customers?: boolean;
  manage_transactions?: boolean;
  [key: string]: boolean | undefined;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  logo_url?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  company_id?: string;
  company?: Company;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  position?: string;
  role: UserRole;
  company_id?: string;
  company?: Company;
  branch_id?: string;
  branch?: Branch;
  staff_permissions?: StaffPermissions;
  avatar_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
}

export interface BankAccount {
  id: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  branch_id: string;
  company_id?: string;
  balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  working_method?: string;
  branch_id?: string | null;
  company_id?: string;
  total_balance: number;
  opening_balance?: number;
  opening_balance_updated_at?: string;
  current_balance?: number;
  last_transaction_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string | null;
  updated_by_email?: string | null;
  partner_type?: string | null; // 'customer' | 'supplier' | 'both'
  nguoi_dai_dien?: string | null; // Representative / Người đại diện
}

export interface Transaction {
  id: string;
  transaction_code: string;
  customer_id: string | null;
  customer_name?: string;
  bank_account_id: string | null;
  bank_account_name?: string;
  branch_id: string | null;
  company_id?: string;
  transaction_type: TransactionType;
  amount: number;
  description?: string;
  reference_number?: string;
  transaction_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  status?: string | null; // 'pending' | 'completed' | 'cancelled'
  customers?: {
    full_name?: string;
    customer_code?: string;
  } | null;
  bank_accounts?: {
    account_name?: string;
  } | null;
  branches?: {
    name?: string;
    code?: string;
  } | null;
  users?: {
    full_name?: string;
    email?: string;
  } | null;
  branch_name?: string;
  creator_name?: string;
}

// Enums
export type UserRole = "admin_master" | "admin_company" | "admin" | "branch_manager" | "staff";
export type TransactionType = "payment" | "charge" | "adjustment" | "refund" | "deposit";
export type ReportType =
  | "keyMetrics"
  | "customerBalance"
  | "transactionReport"
  | "cashFlowReport";
export type ExportFormat = "excel" | "csv";

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface CustomerForm {
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  branch_id?: string;
}

export interface TransactionForm {
  customer_id: string;
  bank_account_id: string;
  transaction_type: TransactionType;
  amount: number;
  description?: string;
  reference_number?: string;
  transaction_date: string;
}

// Import Types
export interface ImportData {
  file?: File | null;
  data: Record<string, unknown>[];
  errors: ImportError[];
  isValid: boolean;
}

export interface ImportError {
  row: number;
  column: string;
  message: string;
  value?: unknown;
}

// Dashboard Types
export interface DashboardMetrics {
  totalOutstanding: number;
  activeCustomers: number;
  monthlyTransactions: number;
  totalTransactions: number;
  balanceByBranch: BalanceByBranch[];
  recentTransactions: Transaction[];
  topCustomers: Customer[];
}

export interface BalanceByBranch {
  branch_id: string;
  branch_name: string;
  balance: number;
}

// Filter Types
export interface CustomerFilters {
  search?: string;
  branch_id?: string;
  is_active?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface TransactionFilters {
  customer_id?: string;
  branch_id?: string;
  transaction_type?: TransactionType;
  dateRange?: {
    start: string;
    end: string;
  };
  amountRange?: {
    min: number;
    max: number;
  };
}

export interface ReportFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  branch_id?: string | null;
  company_id?: string | null;
  includeCharts?: boolean;
  includeDetails?: boolean;
  groupBy?: string | null;
  sortBy?: string | null;
  sortOrder?: "asc" | "desc";
}

// Export Types
export interface ExportOptions {
  format: "xlsx" | "csv";
  filters?: CustomerFilters | TransactionFilters;
  includeHeaders: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

// UI Types
export interface MenuItem {
  path: string;
  name: string;
  icon: React.ReactNode;
  children?: MenuItem[];
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
}

export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

// Chart Types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

// Notification Types
export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
}

// Auth Types
export interface AuthState {
  user: User | null;
  session: Record<string, unknown> | null;
  loading: boolean;
  error: string | null;
}

// Supabase Types
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Environment Types
export interface EnvironmentConfig {
  supabase: SupabaseConfig;
  app: {
    env: "development" | "staging" | "production";
    isDevelopment: boolean;
    isStaging: boolean;
    isProduction: boolean;
  };
  api?: {
    baseUrl?: string;
  };
  analytics?: {
    sentryDsn?: string;
    googleAnalyticsId?: string;
  };
}

export type TimeRange = "day" | "week" | "month" | "quarter" | "year";
