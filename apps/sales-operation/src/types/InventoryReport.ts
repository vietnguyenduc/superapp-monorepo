// Inventory Report types for Task 5 - Báo cáo nhập xuất tồn, so sánh tồn sổ và tồn thực

export interface InventoryVarianceReport {
  id: string;
  date: string; // YYYY-MM-DD format
  product_id: string;
  
  // Beginning inventory
  beginning_inventory: number;
  
  // Inbound movements
  inbound_quantity: number;
  
  // Outbound movements
  sales_quantity: number;
  promotion_quantity: number;
  special_outbound_quantity: number;
  
  // Calculated book inventory (tồn sổ)
  book_inventory: number; // beginning + inbound - sales - promotion - special_outbound
  
  // Actual physical inventory (tồn thực)
  actual_inventory: number;
  
  // Variance analysis
  variance: number; // actual - book
  variance_percentage: number; // (variance / book) * 100
  
  // Unit and notes
  unit: string;
  notes?: string;
  
  // Audit fields
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryReportSummary {
  date: string;
  total_reports: number;
  total_book_inventory: number;
  total_actual_inventory: number;
  total_variance: number;
  positive_variance_count: number;
  negative_variance_count: number;
  zero_variance_count: number;
  high_variance_count: number; // >= 10%
  products_with_variance: string[];
}

export interface InventoryVarianceAlert {
  id: string;
  report_id: string;
  product_id: string;
  variance_type: 'shortage' | 'excess';
  variance_amount: number;
  variance_percentage: number;
  alert_level: 'low' | 'medium' | 'high' | 'critical';
  suggested_action: string;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface InventoryReportFilters {
  search?: string;
  date_from?: string;
  date_to?: string;
  product_id?: string;
  variance_type?: 'all' | 'positive' | 'negative' | 'zero' | 'high';
  alert_level?: 'all' | 'low' | 'medium' | 'high' | 'critical';
}

export interface InventoryReportStats {
  total_reports: number;
  total_book_inventory: number;
  total_actual_inventory: number;
  total_variance: number;
  positive_variance: number;
  negative_variance: number;
  zero_variance: number;
  high_variance: number;
  accuracy_percentage: number;
}

// For creating special outbound requests from high variance reports
export interface VarianceSpecialOutboundRequest {
  report_id: string;
  product_id: string;
  variance_amount: number;
  variance_percentage: number;
  suggested_reason: string;
  suggested_quantity: number;
}

export type InventoryVarianceReportCreateInput = Omit<InventoryVarianceReport, 'id' | 'created_at' | 'updated_at'>;
export type InventoryVarianceReportUpdateInput = Partial<InventoryVarianceReportCreateInput> & { id: string };
