# Product Management Enhancements Design

## Overview

This document outlines the design for enhancing the product management functionality in the inventory-operation application. The enhancements include improved editing capabilities, advanced filtering, and addition of a supplier field to the product schema.

## Current State Analysis

### Existing Product Management (ProductCatalogPageEnhanced.tsx)

**Current Features:**
- Basic CRUD operations (Create, Read, Update, Delete)
- Tab system (List, Single Entry, Bulk Import)
- Simple product table
- Basic search functionality
- Edit mode with form

**Limitations:**
- No advanced filtering options
- No supplier information
- Limited sorting capabilities
- No bulk operations
- No product categories management
- No product variants support
- Limited search (only product name/code)
- No export functionality
- No product history/audit trail

### Cashflow Customer Management Reference

**Features to Adapt:**
- Advanced filtering (date range, status, custom fields)
- Search with multiple criteria
- Bulk operations (delete, update status)
- Export to Excel/CSV
- Customer categories/tags
- Customer history view
- Activity timeline

## Design Goals

1. **Enhanced Editing**: Improved edit form with validation and better UX
2. **Advanced Filtering**: Multi-criteria filtering with saved presets
3. **Supplier Management**: Add supplier field and supplier management
4. **Bulk Operations**: Support for bulk updates and deletions
5. **Product Categories**: Categorize products for better organization
6. **Export Functionality**: Export product data to Excel/CSV
7. **Search Enhancement**: Multi-field search with advanced options
8. **Product History**: Track changes and activity timeline

## Database Schema Changes

### Update products Table

```sql
-- Add supplier field and other enhancements
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'uncategorized',
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_stock_level INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS barcode VARCHAR(50),
ADD COLUMN IF NOT EXISTS sku VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS selling_price DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS margin_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS weight DECIMAL(10,3),
ADD COLUMN IF NOT EXISTS dimensions JSONB DEFAULT '{"length": null, "width": null, "height": null}'::jsonb,
ADD COLUMN IF NOT EXISTS storage_location VARCHAR(100),
ADD COLUMN IF NOT EXISTS shelf_life_days INTEGER,
ADD COLUMN IF NOT EXISTS batch_tracking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS serial_tracking BOOLEAN DEFAULT false;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

-- Comments
COMMENT ON COLUMN products.supplier_id IS 'Reference to the supplier who provides this product';
COMMENT ON COLUMN products.category IS 'Product category for organization and filtering';
COMMENT ON COLUMN products.tags IS 'Array of tags for flexible categorization';
COMMENT ON COLUMN products.min_stock_level IS 'Minimum stock level before reorder';
COMMENT ON COLUMN products.max_stock_level IS 'Maximum stock level for storage capacity';
COMMENT ON COLUMN products.reorder_point IS 'Stock level at which to trigger reorder';
COMMENT ON COLUMN products.lead_time_days IS 'Days required to receive stock from supplier';
COMMENT ON COLUMN products.is_active IS 'Whether the product is currently active';
COMMENT ON COLUMN products.barcode IS 'Product barcode for scanning';
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit - unique identifier';
COMMENT ON COLUMN products.cost_price IS 'Cost price from supplier';
COMMENT ON COLUMN products.selling_price IS 'Selling price to customers';
COMMENT ON COLUMN products.margin_percentage IS 'Profit margin percentage';
COMMENT ON COLUMN products.weight IS 'Product weight in kg';
COMMENT ON COLUMN products.dimensions IS 'Product dimensions (length, width, height) in cm';
COMMENT ON COLUMN products.storage_location IS 'Physical storage location in warehouse';
COMMENT ON COLUMN products.shelf_life_days IS 'Product shelf life in days';
COMMENT ON COLUMN products.batch_tracking IS 'Whether to track by batch/lot number';
COMMENT ON COLUMN products.serial_tracking IS 'Whether to track individual serial numbers';
```

### Create suppliers Table

```sql
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Supplier information
  supplier_code VARCHAR(50) UNIQUE NOT NULL,
  supplier_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Vietnam',
  
  -- Business details
  tax_id VARCHAR(50),
  payment_terms VARCHAR(100),
  credit_limit DECIMAL(15,2),
  currency VARCHAR(10) DEFAULT 'VND',
  
  -- Performance tracking
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  total_orders INTEGER DEFAULT 0,
  total_value DECIMAL(15,2) DEFAULT 0,
  on_time_delivery_rate DECIMAL(5,2),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_preferred BOOLEAN DEFAULT false,
  
  -- Additional information
  notes TEXT,
  website VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_company_id ON suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_code ON suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_preferred ON suppliers(is_preferred);

-- Comments
COMMENT ON TABLE suppliers IS 'Supplier information for product sourcing';
COMMENT ON COLUMN suppliers.supplier_code IS 'Unique supplier code';
COMMENT ON COLUMN suppliers.rating IS 'Supplier performance rating (1-5)';
COMMENT ON COLUMN suppliers.on_time_delivery_rate IS 'Percentage of on-time deliveries';
COMMENT ON COLUMN suppliers.is_preferred IS 'Whether this is a preferred supplier';
```

### Create product_history Table (Audit Trail)

```sql
CREATE TABLE IF NOT EXISTS product_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Change tracking
  action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'price_changed', 'stock_adjusted')),
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Change details
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  change_details JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_history_product_id ON product_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_history_company_id ON product_history(company_id);
CREATE INDEX IF NOT EXISTS idx_product_history_action ON product_history(action);
CREATE INDEX IF NOT EXISTS idx_product_history_created_at ON product_history(created_at DESC);

-- Comments
COMMENT ON TABLE product_history IS 'Audit trail for product changes';
COMMENT ON COLUMN product_history.action IS 'Type of change that occurred';
COMMENT ON COLUMN product_history.field_name IS 'Name of the field that changed';
COMMENT ON COLUMN product_history.change_details IS 'Additional details about the change in JSON format';
```

## Component Design

### 1. Enhanced Product Table

```typescript
interface ProductTableProps {
  products: Product[];
  loading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkUpdate: (ids: string[], updates: Partial<Product>) => void;
  onExport: (format: 'excel' | 'csv') => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  filters: ProductFilters;
  onFilterChange: (filters: ProductFilters) => void;
  sort: SortConfig;
  onSortChange: (sort: SortConfig) => void;
}

interface ProductFilters {
  search: string;
  category: string;
  supplierId: string;
  status: 'all' | 'active' | 'inactive';
  priceRange: { min: number; max: number };
  stockLevel: 'all' | 'low' | 'normal' | 'high';
  tags: string[];
  dateRange: { start: string; end: string };
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}
```

**Features:**
- Multi-select with checkboxes
- Sortable columns (click header to sort)
- Column visibility toggle
- Responsive design
- Row actions (edit, delete, view history)
- Bulk action toolbar
- Filter panel
- Pagination

### 2. Advanced Filter Panel

```typescript
interface ProductFilterPanelProps {
  filters: ProductFilters;
  onFilterChange: (filters: ProductFilters) => void;
  onReset: () => void;
  onSavePreset: (name: string, filters: ProductFilters) => void;
  onLoadPreset: (preset: FilterPreset) => void;
  availableOptions: {
    categories: string[];
    suppliers: Supplier[];
    tags: string[];
  };
}

interface FilterPreset {
  id: string;
  name: string;
  filters: ProductFilters;
  createdAt: string;
}
```

**Features:**
- Collapsible panel
- Multiple filter criteria
- Quick presets (Active Products, Low Stock, etc.)
- Save custom filter presets
- Load saved presets
- Clear all filters
- Filter count badge

### 3. Enhanced Product Form

```typescript
interface ProductFormProps {
  product?: Product; // If provided, edit mode
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  suppliers: Supplier[];
  categories: string[];
  loading: boolean;
}

interface ProductFormData {
  // Basic information
  businessCode: string;
  name: string;
  category: string;
  tags: string[];
  
  // Supplier
  supplierId?: string;
  
  // Quantities and units
  inputQuantity: number;
  outputQuantity: number;
  inputUnit: string;
  outputUnit: string;
  
  // Pricing
  costPrice?: number;
  sellingPrice?: number;
  marginPercentage?: number;
  
  // Inventory settings
  minStockLevel: number;
  maxStockLevel?: number;
  reorderPoint: number;
  leadTimeDays: number;
  
  // Physical attributes
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  storageLocation?: string;
  
  // Tracking
  barcode?: string;
  sku?: string;
  batchTracking: boolean;
  serialTracking: boolean;
  
  // Shelf life
  shelfLifeDays?: number;
  
  // Status
  isActive: boolean;
  
  // Additional
  notes?: string;
}
```

**Features:**
- Tabbed form sections (Basic, Inventory, Pricing, Tracking)
- Real-time validation
- Auto-calculate margin from cost and selling price
- Supplier dropdown with search
- Category dropdown with add new option
- Tag input with suggestions
- Image upload for product photo
- Save as draft
- Preview changes before submit

### 4. Supplier Management Component

```typescript
interface SupplierManagementProps {
  suppliers: Supplier[];
  loading: boolean;
  onAdd: (supplier: SupplierFormData) => Promise<void>;
  onEdit: (id: string, supplier: SupplierFormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onExport: (format: 'excel' | 'csv') => void;
}

interface SupplierFormData {
  supplierCode: string;
  supplierName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  paymentTerms?: string;
  creditLimit?: number;
  currency?: string;
  notes?: string;
  website?: string;
}
```

**Features:**
- Supplier list with performance metrics
- Add/Edit supplier form
- Supplier rating system
- Order history per supplier
- Preferred supplier designation
- Contact information management
- Export supplier list

### 5. Product History Component

```typescript
interface ProductHistoryProps {
  productId: string;
  history: ProductHistoryEntry[];
  loading: boolean;
}

interface ProductHistoryEntry {
  id: string;
  action: 'created' | 'updated' | 'deleted' | 'price_changed' | 'stock_adjusted';
  changedBy: string;
  changedAt: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changeDetails: Record<string, any>;
}
```

**Features:**
- Timeline view of changes
- Color-coded by action type
- Show before/after values
- Filter by action type
- Date range filter
- Export history

### 6. Bulk Operations Component

```typescript
interface BulkOperationsProps {
  selectedIds: string[];
  onBulkDelete: (ids: string[]) => Promise<void>;
  onBulkUpdate: (ids: string[], updates: Partial<Product>) => Promise<void>;
  onBulkExport: (ids: string[], format: 'excel' | 'csv') => Promise<void>;
  availableBulkActions: BulkAction[];
}

interface BulkAction {
  id: string;
  label: string;
  icon: string;
  type: 'delete' | 'update' | 'export';
  requiresConfirmation: boolean;
  fields?: FieldConfig[]; // For bulk update
}
```

**Features:**
- Bulk delete with confirmation
- Bulk update (status, category, supplier, etc.)
- Bulk export selected items
- Action confirmation dialogs
- Progress indicator
- Error handling with rollback

## Page Layout Design

### Product Management Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Danh mục hàng hóa  [+ Add] [Export] [Filters]      │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Filter Panel (Collapsible)                               │ │
│ │ [Search] [Category] [Supplier] [Status] [Price Range]    │ │
│ │ [Save Preset] [Load Preset] [Clear All]                  │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Bulk Actions (shown when items selected)                 │ │
│ │ [Delete Selected] [Update Status] [Export Selected]      │ │
│ │ Selected: 5 items [Clear Selection]                      │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Product Table                                            │ │
│ │ [☐] Code | Name | Category | Supplier | Stock | Price  │ │
│ │ [☐] NVL001| Cam    | Raw Mat   | SupplierA| 100   | 5,000 │ │
│ │ [☐] NVL002| Nho    | Raw Mat   | SupplierB| 200   | 8,000 │ │
│ │ ...                                                      │ │
│ │ Pagination: [Previous] 1-50 of 200 [Next]               │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Product Endpoints

```typescript
// Get products with filters
GET /api/products
Query Params:
  - search: string
  - category: string
  - supplier_id: string
  - status: 'active' | 'inactive'
  - min_price: number
  - max_price: number
  - stock_level: 'low' | 'normal' | 'high'
  - tags: string[]
  - sort_by: string
  - sort_direction: 'asc' | 'desc'
  - page: number
  - limit: number

// Get single product
GET /api/products/:id

// Create product
POST /api/products
Body: ProductFormData

// Update product
PUT /api/products/:id
Body: Partial<ProductFormData>

// Delete product
DELETE /api/products/:id

// Bulk update products
PATCH /api/products/bulk
Body: {
  ids: string[]
  updates: Partial<ProductFormData>
}

// Bulk delete products
DELETE /api/products/bulk
Body: { ids: string[] }

// Get product history
GET /api/products/:id/history

// Export products
GET /api/products/export
Query Params:
  - format: 'excel' | 'csv'
  - filters: ProductFilters
```

### Supplier Endpoints

```typescript
// Get suppliers
GET /api/suppliers
Query Params:
  - search: string
  - is_active: boolean
  - is_preferred: boolean
  - sort_by: string
  - sort_direction: 'asc' | 'desc'

// Get single supplier
GET /api/suppliers/:id

// Create supplier
POST /api/suppliers
Body: SupplierFormData

// Update supplier
PUT /api/suppliers/:id
Body: Partial<SupplierFormData>

// Delete supplier
DELETE /api/suppliers/:id

// Get supplier products
GET /api/suppliers/:id/products

// Export suppliers
GET /api/suppliers/export
Query Params:
  - format: 'excel' | 'csv'
```

## TypeScript Type Definitions

### Update Product Types

```typescript
export interface Product {
  id: string;
  company_id: string;
  branch_id?: string;
  
  // Basic information
  business_code: string;
  name: string;
  category: string;
  tags: string[];
  
  // Supplier
  supplier_id?: string;
  supplier?: Supplier; // Joined data
  
  // Quantities and units
  input_quantity: number;
  output_quantity: number;
  input_unit: string;
  output_unit: string;
  
  // Pricing
  cost_price?: number;
  selling_price?: number;
  margin_percentage?: number;
  
  // Inventory settings
  min_stock_level: number;
  max_stock_level?: number;
  reorder_point: number;
  lead_time_days: number;
  
  // Physical attributes
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  storage_location?: string;
  
  // Tracking
  barcode?: string;
  sku?: string;
  batch_tracking: boolean;
  serial_tracking: boolean;
  
  // Shelf life
  shelf_life_days?: number;
  
  // Status
  is_active: boolean;
  
  // Additional
  notes?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface Supplier {
  id: string;
  company_id: string;
  
  // Supplier information
  supplier_code: string;
  supplier_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  
  // Address
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  
  // Business details
  tax_id?: string;
  payment_terms?: string;
  credit_limit?: number;
  currency?: string;
  
  // Performance tracking
  rating?: number;
  total_orders: number;
  total_value: number;
  on_time_delivery_rate?: number;
  
  // Status
  is_active: boolean;
  is_preferred: boolean;
  
  // Additional information
  notes?: string;
  website?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface ProductHistoryEntry {
  id: string;
  product_id: string;
  company_id: string;
  action: 'created' | 'updated' | 'deleted' | 'price_changed' | 'stock_adjusted';
  changed_by?: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  change_details: Record<string, any>;
  created_at: string;
}
```

## Implementation Phases

### Phase 1: Database Schema (Week 1)
- Create migration file for schema changes
- Add supplier table
- Update products table with new fields
- Create product_history table
- Add indexes and constraints
- Test migration locally

### Phase 2: Service Layer (Week 1-2)
- Create supplier service
- Update product service with new fields
- Create product history service
- Implement bulk operations
- Add filtering logic
- Add export functionality

### Phase 3: UI Components (Week 2-3)
- Create enhanced product table
- Create advanced filter panel
- Create enhanced product form
- Create supplier management component
- Create product history component
- Create bulk operations component

### Phase 4: Integration (Week 3-4)
- Integrate components into product management page
- Connect to service layer
- Implement form validation
- Add error handling
- Add loading states
- Test all functionality

### Phase 5: Polish & Testing (Week 4-5)
- Responsive design testing
- Performance optimization
- Accessibility improvements
- User acceptance testing
- Bug fixes and refinements

### Phase 6: Documentation (Week 5)
- Update API documentation
- Add component documentation
- Create user guide
- Update database documentation

## Testing Strategy

### Unit Tests
- Test service layer functions
- Test filter logic
- Test bulk operations
- Test validation

### Integration Tests
- Test database operations
- Test component interactions
- Test API endpoints
- Test export functionality

### Manual Testing
- Create product with all fields
- Edit product with various field changes
- Test advanced filters
- Test bulk operations
- Test supplier management
- Test product history
- Test export functionality

## Success Metrics

### User Engagement
- Increase product management page views by 25%
- Increase filter usage by 40%
- Increase bulk operation usage by 30%

### Data Quality
- Increase products with supplier information by 50%
- Increase products with categories by 60%
- Increase products with pricing information by 40%

### Efficiency
- Reduce time to find products by 50%
- Reduce time to update multiple products by 60%
- Increase data accuracy through validation

## Risks & Mitigations

### Risk 1: Migration Complexity
**Mitigation:** Thorough testing, rollback plan, phased migration

### Risk 2: Performance Impact
**Mitigation:** Proper indexing, query optimization, pagination

### Risk 3: User Confusion
**Mitigation:** Clear UI labels, onboarding tour, help documentation

### Risk 4: Data Loss
**Mitigation:** Backup before migration, transaction safety, audit trail

## Conclusion

The product management enhancements provide significant improvements over the current implementation by adding advanced filtering, supplier management, bulk operations, and better editing capabilities. The phased approach allows for incremental delivery while minimizing risk.

Key benefits include:
- Better product organization with categories and tags
- Improved supplier relationship management
- More efficient bulk operations
- Better data quality through validation
- Complete audit trail for compliance
- Enhanced search and filtering capabilities

The implementation is estimated to take 5 weeks with proper testing and documentation.
