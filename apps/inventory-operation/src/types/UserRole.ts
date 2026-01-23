// User Role and Permission types for inventory-operation system

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions: Permission[];
  
  // Status
  isActive: boolean;
  lastLoginAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export enum UserRole {
  WAREHOUSE_KEEPER = 'warehouse_keeper', // Thủ kho
  WAREHOUSE_ACCOUNTANT = 'warehouse_accountant', // Kế toán kho
  OPERATIONS_MANAGER = 'operations_manager', // Quản lý vận hành
  BUSINESS_OWNER = 'business_owner', // Chủ doanh nghiệp
  ADMIN = 'admin', // Admin hệ thống
}

export enum Permission {
  // Inventory Input (Nhập liệu tồn kho)
  INVENTORY_INPUT_VIEW = 'inventory_input_view',
  INVENTORY_INPUT_CREATE = 'inventory_input_create',
  INVENTORY_INPUT_EDIT = 'inventory_input_edit',
  INVENTORY_INPUT_DELETE = 'inventory_input_delete',
  
  // Product Catalog (Danh mục hàng hóa)
  PRODUCT_CATALOG_VIEW = 'product_catalog_view',
  PRODUCT_CATALOG_CREATE = 'product_catalog_create',
  PRODUCT_CATALOG_EDIT = 'product_catalog_edit',
  PRODUCT_CATALOG_DELETE = 'product_catalog_delete',
  
  // Sales Report (Báo cáo bán hàng)
  SALES_REPORT_VIEW = 'sales_report_view',
  SALES_REPORT_CREATE = 'sales_report_create',
  SALES_REPORT_EDIT = 'sales_report_edit',
  SALES_REPORT_DELETE = 'sales_report_delete',
  
  // Special Outbound (Xuất đặc biệt)
  SPECIAL_OUTBOUND_VIEW = 'special_outbound_view',
  SPECIAL_OUTBOUND_CREATE = 'special_outbound_create',
  SPECIAL_OUTBOUND_APPROVE = 'special_outbound_approve',
  SPECIAL_OUTBOUND_REJECT = 'special_outbound_reject',
  
  // Inventory Report (Báo cáo nhập xuất tồn)
  INVENTORY_REPORT_VIEW = 'inventory_report_view',
  INVENTORY_REPORT_EXPORT = 'inventory_report_export',
  
  // Stock Check Print (In phiếu kiểm kho)
  STOCK_CHECK_PRINT = 'stock_check_print',
  STOCK_CHECK_EXPORT = 'stock_check_export',
  
  // Dashboard
  DASHBOARD_VIEW = 'dashboard_view',
  DASHBOARD_ANALYTICS = 'dashboard_analytics',
  
  // Settings
  SETTINGS_VIEW = 'settings_view',
  SETTINGS_EDIT = 'settings_edit',
  USER_MANAGEMENT = 'user_management',
  
  // System
  SYSTEM_ADMIN = 'system_admin',
  AUDIT_LOG_VIEW = 'audit_log_view',
}

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.WAREHOUSE_KEEPER]: [
    Permission.INVENTORY_INPUT_VIEW,
    Permission.INVENTORY_INPUT_CREATE,
    Permission.INVENTORY_INPUT_EDIT,
    Permission.PRODUCT_CATALOG_VIEW,
    Permission.INVENTORY_REPORT_VIEW,
    Permission.STOCK_CHECK_PRINT,
    Permission.DASHBOARD_VIEW,
  ],
  
  [UserRole.WAREHOUSE_ACCOUNTANT]: [
    Permission.INVENTORY_INPUT_VIEW,
    Permission.PRODUCT_CATALOG_VIEW,
    Permission.PRODUCT_CATALOG_EDIT,
    Permission.SALES_REPORT_VIEW,
    Permission.SALES_REPORT_CREATE,
    Permission.SALES_REPORT_EDIT,
    Permission.SPECIAL_OUTBOUND_VIEW,
    Permission.SPECIAL_OUTBOUND_CREATE,
    Permission.INVENTORY_REPORT_VIEW,
    Permission.INVENTORY_REPORT_EXPORT,
    Permission.STOCK_CHECK_PRINT,
    Permission.STOCK_CHECK_EXPORT,
    Permission.DASHBOARD_VIEW,
  ],
  
  [UserRole.OPERATIONS_MANAGER]: [
    Permission.INVENTORY_INPUT_VIEW,
    Permission.PRODUCT_CATALOG_VIEW,
    Permission.PRODUCT_CATALOG_CREATE,
    Permission.PRODUCT_CATALOG_EDIT,
    Permission.SALES_REPORT_VIEW,
    Permission.SPECIAL_OUTBOUND_VIEW,
    Permission.SPECIAL_OUTBOUND_APPROVE,
    Permission.SPECIAL_OUTBOUND_REJECT,
    Permission.INVENTORY_REPORT_VIEW,
    Permission.INVENTORY_REPORT_EXPORT,
    Permission.STOCK_CHECK_PRINT,
    Permission.STOCK_CHECK_EXPORT,
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_ANALYTICS,
    Permission.SETTINGS_VIEW,
  ],
  
  [UserRole.BUSINESS_OWNER]: [
    Permission.INVENTORY_INPUT_VIEW,
    Permission.PRODUCT_CATALOG_VIEW,
    Permission.PRODUCT_CATALOG_CREATE,
    Permission.PRODUCT_CATALOG_EDIT,
    Permission.SALES_REPORT_VIEW,
    Permission.SPECIAL_OUTBOUND_VIEW,
    Permission.SPECIAL_OUTBOUND_APPROVE,
    Permission.SPECIAL_OUTBOUND_REJECT,
    Permission.INVENTORY_REPORT_VIEW,
    Permission.INVENTORY_REPORT_EXPORT,
    Permission.STOCK_CHECK_PRINT,
    Permission.STOCK_CHECK_EXPORT,
    Permission.DASHBOARD_VIEW,
    Permission.DASHBOARD_ANALYTICS,
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
    Permission.USER_MANAGEMENT,
    Permission.AUDIT_LOG_VIEW,
  ],
  
  [UserRole.ADMIN]: Object.values(Permission), // All permissions
};

// Helper functions
export const hasPermission = (user: User, permission: Permission): boolean => {
  return user.permissions.includes(permission);
};

export const getRolePermissions = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    [UserRole.WAREHOUSE_KEEPER]: 'Thủ kho',
    [UserRole.WAREHOUSE_ACCOUNTANT]: 'Kế toán kho',
    [UserRole.OPERATIONS_MANAGER]: 'Quản lý vận hành',
    [UserRole.BUSINESS_OWNER]: 'Chủ doanh nghiệp',
    [UserRole.ADMIN]: 'Quản trị viên',
  };
  return roleNames[role] || role;
};
