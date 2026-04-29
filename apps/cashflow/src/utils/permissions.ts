// Granular permission checking utility

interface UserPermissions {
  customers?: {
    import_own?: boolean;
    manage_all?: boolean;
  };
  transactions?: {
    import_own?: boolean;
    manage_all?: boolean;
  };
  settings?: {
    edit_general?: boolean;
    branches?: boolean;
    bank_accounts?: boolean;
    transaction_types?: boolean;
    customer_fields?: boolean;
    color_settings?: boolean;
    reports?: boolean;
  };
  reports?: {
    view?: boolean;
  };
}

interface User {
  id: string;
  role: string;
  staff_permissions?: UserPermissions;
  can_delete?: boolean;
}

// Centralized admin-role check. Returns true for any of: admin, admin_master, admin_company.
export function isAdmin(user?: { role?: string } | null): boolean {
  if (!user?.role) return false;
  return user.role === "admin" || user.role === "admin_master" || user.role === "admin_company";
}

// Check if user can import customers (create and edit their own)
export function canImportCustomers(user: User): boolean {
  if (!user) return false;
  if (user.role === 'admin_master' || user.role === 'admin' || user.role === 'admin_company') return true;
  return Boolean(user.staff_permissions?.customers?.import_own);
}

// Check if user can manage all customers (edit/delete any customer)
export function canManageAllCustomers(user: User): boolean {
  if (!user) return false;
  if (user.role === 'admin_master' || user.role === 'admin' || user.role === 'admin_company') return true;
  return Boolean(user.staff_permissions?.customers?.manage_all);
}

// Check if user can edit a specific customer (own or all)
export function canEditCustomer(user: User, customerCreatedBy?: string): boolean {
  if (!user) return false;
  if (user.role === 'admin_master' || user.role === 'admin' || user.role === 'admin_company') return true;
  
  const canManageAll = Boolean(user.staff_permissions?.customers?.manage_all);
  const canImportOwn = Boolean(user.staff_permissions?.customers?.import_own);
  
  // If can manage all, can edit any customer
  if (canManageAll) return true;
  
  // If can only import own, can edit only own customers
  if (canImportOwn) {
    return customerCreatedBy === user.id;
  }
  
  return false;
}

// Check if user can delete a specific customer
export function canDeleteCustomer(user: User): boolean {
  if (!user) return false;
  if (!user.can_delete) return false;
  if (user.role === 'admin_master' || user.role === 'admin' || user.role === 'admin_company') return true;
  return Boolean(user.staff_permissions?.customers?.manage_all);
}

// Check if user can import transactions (create and edit their own)
export function canImportTransactions(user: User): boolean {
  if (!user) return false;
  if (user.role === 'admin_master' || user.role === 'admin' || user.role === 'admin_company') return true;
  return Boolean(user.staff_permissions?.transactions?.import_own);
}

// Check if user can manage all transactions (edit/delete any transaction)
export function canManageAllTransactions(user: User): boolean {
  if (!user) return false;
  if (user.role === 'admin_master' || user.role === 'admin' || user.role === 'admin_company') return true;
  return Boolean(user.staff_permissions?.transactions?.manage_all);
}

// Check if user can edit a specific transaction (own or all)
export function canEditTransaction(user: User, transactionCreatedBy?: string): boolean {
  if (!user) return false;
  if (user.role === 'admin_master' || user.role === 'admin' || user.role === 'admin_company') return true;
  
  const canManageAll = Boolean(user.staff_permissions?.transactions?.manage_all);
  const canImportOwn = Boolean(user.staff_permissions?.transactions?.import_own);
  
  // If can manage all, can edit any transaction
  if (canManageAll) return true;
  
  // If can only import own, can edit only own transactions
  if (canImportOwn) {
    return transactionCreatedBy === user.id;
  }
  
  return false;
}

// Check if user can delete a specific transaction
export function canDeleteTransaction(user: User): boolean {
  if (!user) return false;
  if (!user.can_delete) return false;
  if (user.role === 'admin_master' || user.role === 'admin' || user.role === 'admin_company') return true;
  return Boolean(user.staff_permissions?.transactions?.manage_all);
}

// Check if user can edit general settings
export function canEditGeneralSettings(user: User): boolean {
  if (!user) return false;
  if (user.role === 'admin_master' || user.role === 'admin' || user.role === 'admin_company') return true;
  return Boolean(user.staff_permissions?.settings?.edit_general);
}

// Check if user can edit branch settings
export function canEditBranchSettings(user: User): boolean {
  if (!user) return false;
  if (user.role === 'admin_master' || user.role === 'admin' || user.role === 'admin_company') return true;
  return Boolean(user.staff_permissions?.settings?.branches);
}

// Check if user can edit bank account settings
export function canEditBankAccountSettings(user: User): boolean {
  if (!user) return false;
  if (user.role === 'admin_master' || user.role === 'admin' || user.role === 'admin_company') return true;
  return Boolean(user.staff_permissions?.settings?.bank_accounts);
}

// Check if user can edit transaction type settings
export function canEditTransactionTypeSettings(user: User): boolean {
  if (!user) return false;
  if (user.role === 'admin_master' || user.role === 'admin' || user.role === 'admin_company') return true;
  return Boolean(user.staff_permissions?.settings?.transaction_types);
}

// Check if user can edit customer field settings
export function canEditCustomerFieldSettings(user: User): boolean {
  if (!user) return false;
  if (user.role === 'admin_master' || user.role === 'admin' || user.role === 'admin_company') return true;
  return Boolean(user.staff_permissions?.settings?.customer_fields);
}

// Check if user can edit color settings
export function canEditColorSettings(user: User): boolean {
  if (!user) return false;
  if (user.role === 'admin_master' || user.role === 'admin' || user.role === 'admin_company') return true;
  return Boolean(user.staff_permissions?.settings?.color_settings);
}

// Check if user can edit report settings
export function canEditReportSettings(user: User): boolean {
  if (!user) return false;
  if (user.role === 'admin_master' || user.role === 'admin' || user.role === 'admin_company') return true;
  return Boolean(user.staff_permissions?.settings?.reports);
}

// Check if user can view reports
export function canViewReports(user: User): boolean {
  if (!user) return false;
  if (user.role === 'admin_master' || user.role === 'admin' || user.role === 'admin_company') return true;
  return Boolean(user.staff_permissions?.reports?.view);
}

// Check if user can access Settings tab (Accounts and Permissions)
// Only admin and admin_master can access this
export function canAccessAccountsAndPermissions(user: User): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'admin_master';
}

// Check if user can revert a specific table from backup
// Admins can revert any table, staff can only revert tables they have permission for
export function canRevertTable(user: User, tableName: string): boolean {
  if (!user) return false;
  
  // Admins can revert any table
  if (user.role === 'admin_master' || user.role === 'admin' || user.role === 'admin_company') {
    return true;
  }
  
  // Check granular permissions for staff
  const permissions = user.staff_permissions;
  
  switch (tableName) {
    case 'customers':
      return Boolean(permissions?.customers?.import_own || permissions?.customers?.manage_all);
    case 'transactions':
      return Boolean(permissions?.transactions?.import_own || permissions?.transactions?.manage_all);
    case 'bank_accounts':
      return Boolean(permissions?.settings?.bank_accounts);
    case 'branches':
      return Boolean(permissions?.settings?.branches);
    case 'transaction_types':
      return Boolean(permissions?.settings?.transaction_types);
    case 'customer_fields':
      return Boolean(permissions?.settings?.customer_fields);
    default:
      return false;
  }
}

// Check if user can restore full backup
// Only admin_master and admin_company can restore full backups
export function canRestoreFullBackup(user: User): boolean {
  if (!user) return false;
  return user.role === 'admin_master' || user.role === 'admin_company';
}
