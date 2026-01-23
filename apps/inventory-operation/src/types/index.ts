// Main types export file for inventory-operation app

// Product and catalog types
export * from './Product';

// Inventory management types
export * from './InventoryRecord';

// Sales and outbound types
export * from './SalesRecord';

// User management and permissions
export * from './UserRole';

// Approval workflow and audit trail
export * from './ApprovalLog';

// Inventory reporting and variance analysis
export * from './InventoryReport';

// Import/Export types
export * from './import';

// Common utility types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface FilterOptions {
  search?: string;
  dateRange?: DateRange;
  status?: string;
  category?: string;
  [key: string]: any;
}
