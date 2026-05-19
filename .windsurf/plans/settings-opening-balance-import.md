# Settings Opening Balance Import Design

## Overview

This document outlines the design for implementing the opening balance import functionality in the inventory-operation application's settings. This feature allows users to import initial inventory balances from external files, setting up the starting point for inventory tracking.

## Current State Analysis

### Existing Settings Page (SettingsPage.tsx)

**Current Features:**
- Tab system (Opening Balance, Branches, Transaction Types, Staff Permissions)
- Opening Balance tab displays static example data
- No actual import functionality
- No file upload capability
- No validation
- No preview before import

**Limitations:**
- Opening balance import is just a UI mockup
- No file upload functionality
- No data validation
- No preview before committing
- No import history
- No error handling
- No template download

### Cashflow Opening Balance Import Reference

**Features to Adapt:**
- File upload (Excel/CSV)
- Template download with examples
- Data validation and cleaning
- Preview before import
- Import summary with results
- Error reporting
- Import history
- Balance verification

## Design Goals

1. **File Upload**: Support Excel and CSV file uploads
2. **Template System**: Downloadable templates with examples
3. **Data Validation**: Comprehensive validation before import
4. **Data Preview**: Review data before committing
5. **Import Processing**: Efficient batch processing
6. **Import Summary**: Detailed results and error reporting
7. **Import History**: Track all opening balance imports
8. **Balance Verification**: Verify imported balances match expected totals

## Database Schema

### Opening Balance Imports Table

```sql
CREATE TABLE IF NOT EXISTS opening_balance_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Import metadata
  import_name VARCHAR(255) NOT NULL,
  import_date DATE NOT NULL,
  import_type VARCHAR(50) DEFAULT 'initial' CHECK (import_type IN ('initial', 'adjustment', 'correction')),
  
  -- File information
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  file_url TEXT,
  
  -- Import results
  total_records INTEGER NOT NULL DEFAULT 0,
  successful_records INTEGER NOT NULL DEFAULT 0,
  failed_records INTEGER NOT NULL DEFAULT 0,
  skipped_records INTEGER NOT NULL DEFAULT 0,
  
  -- Balance verification
  total_imported_value DECIMAL(15,2) DEFAULT 0,
  expected_total_value DECIMAL(15,2),
  variance DECIMAL(15,2) DEFAULT 0,
  variance_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Status
  import_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (import_status IN ('pending', 'validating', 'previewing', 'importing', 'completed', 'failed', 'cancelled')),
  
  -- Additional information
  notes TEXT,
  error_summary JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_opening_balance_imports_company_id ON opening_balance_imports(company_id);
CREATE INDEX IF NOT EXISTS idx_opening_balance_imports_branch_id ON opening_balance_imports(branch_id);
CREATE INDEX IF NOT EXISTS idx_opening_balance_imports_user_id ON opening_balance_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_opening_balance_imports_import_date ON opening_balance_imports(import_date);
CREATE INDEX IF NOT EXISTS idx_opening_balance_imports_import_status ON opening_balance_imports(import_status);
CREATE INDEX IF NOT EXISTS idx_opening_balance_imports_created_at ON opening_balance_imports(created_at DESC);

-- Comments
COMMENT ON TABLE opening_balance_imports IS 'Tracks opening balance imports for inventory initialization';
COMMENT ON COLUMN opening_balance_imports.import_type IS 'Type of import: initial setup, adjustment, or correction';
COMMENT ON COLUMN opening_balance_imports.total_imported_value IS 'Total value of successfully imported items';
COMMENT ON COLUMN opening_balance_imports.expected_total_value IS 'Expected total value from file header or user input';
COMMENT ON COLUMN opening_balance_imports.variance IS 'Difference between imported and expected total value';
```

### Opening Balance Import Details Table

```sql
CREATE TABLE IF NOT EXISTS opening_balance_import_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID NOT NULL REFERENCES opening_balance_imports(id) ON DELETE CASCADE,
  
  -- Product information
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_code VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  
  -- Balance information
  opening_quantity DECIMAL(15,3) NOT NULL,
  unit_cost DECIMAL(15,2) NOT NULL,
  total_value DECIMAL(15,2) NOT NULL,
  
  -- Import status
  import_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (import_status IN ('pending', 'imported', 'failed', 'skipped')),
  
  -- Error handling
  error_message TEXT,
  error_code VARCHAR(50),
  
  -- Additional information
  notes TEXT,
  category VARCHAR(100),
  supplier_name VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_opening_balance_import_details_import_id ON opening_balance_import_details(import_id);
CREATE INDEX IF NOT EXISTS idx_opening_balance_import_details_product_id ON opening_balance_import_details(product_id);
CREATE INDEX IF NOT EXISTS idx_opening_balance_import_details_product_code ON opening_balance_import_details(product_code);
CREATE INDEX IF NOT EXISTS idx_opening_balance_import_details_import_status ON opening_balance_import_details(import_status);

-- Comments
COMMENT ON TABLE opening_balance_import_details IS 'Detailed records for each item in an opening balance import';
COMMENT ON COLUMN opening_balance_import_details.import_status IS 'Status of individual item import';
```

## Component Design

### 1. Opening Balance Import Component

```typescript
interface OpeningBalanceImportProps {
  companyId: string;
  branchId?: string;
  userId: string;
  onImportComplete: (importId: string) => void;
  onCancel: () => void;
}

// UI Structure
┌─────────────────────────────────────────────────────────┐
│ Opening Balance Import                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Step 1: Upload File                                 │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │                                                       │ │
│ │ [Drag & drop file here or click to browse]          │ │
│ │                                                       │ │
│ │ Supported formats: .xlsx, .csv                     │ │
│ │ Max file size: 10MB                                 │ │
│ │                                                       │ │
│ │ [Download Template] [View Example Data]              │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Step 2: Validate Data                                │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │                                                       │ │
│ │ Total Records: 150                                  │ │
│ │ Valid Records: 142 ✓                                │ │
│ │ Invalid Records: 8 ✗                                │ │
│ │                                                       │ │
│ │ [View Errors] [Import Valid Only] [Import All]       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Step 3: Preview Data                                 │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │                                                       │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ Code  | Name    | Quantity | Cost  | Value     │ │ │
│ │ ├─────────────────────────────────────────────────┤ │ │
│ │ │ NVL001| Cam     | 100      | 5,000 | 500,000   │ │ │
│ │ │ NVL002| Nho     | 200      | 8,000 | 1,600,000 │ │ │
│ │ │ ...   | ...     | ...      | ...   | ...       │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ │                                                       │ │
│ │ Total Value: 2,100,000 VND                          │ │
│ │ Expected Total: 2,100,000 VND ✓                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [Previous] [Import] [Cancel]                            │
└─────────────────────────────────────────────────────────┘
```

### 2. Template Download Component

```typescript
interface TemplateDownloadProps {
  onDownload: (templateType: 'simple' | 'complete' | 'with_suppliers') => void;
}

// Features:
- Simple template (basic fields only)
- Complete template (all fields)
- Template with suppliers
- Example data included
- Instructions sheet
- Validation rules sheet
```

### 3. Data Validation Component

```typescript
interface DataValidationProps {
  data: OpeningBalanceRow[];
  onValidationComplete: (results: ValidationResult) => void;
  onFixErrors: (errors: ValidationError[]) => void;
}

interface OpeningBalanceRow {
  productCode: string;
  productName: string;
  quantity: number;
  unitCost: number;
  category?: string;
  supplierName?: string;
  notes?: string;
}

interface ValidationResult {
  valid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}
```

**Validation Rules:**
- Required fields (product code, name, quantity, unit cost)
- Data type validation (numbers for quantity and cost)
- Range validation (quantity > 0, cost > 0)
- Product code format validation
- Product existence check (optional)
- Duplicate product code detection
- Total value verification

### 4. Import Progress Component

```typescript
interface ImportProgressProps {
  progress: ImportProgress;
  onCancel: () => void;
}

interface ImportProgress {
  status: 'validating' | 'importing' | 'completed' | 'failed';
  currentStep: number;
  totalSteps: number;
  processedRecords: number;
  totalRecords: number;
  currentRecord?: string;
  errors: ImportError[];
}

// UI Features:
- Progress bar
- Current step indicator
- Records processed counter
- Error count
- Cancel button
- Error preview
```

### 5. Import Summary Component

```typescript
interface ImportSummaryProps {
  importId: string;
  summary: ImportSummary;
  onDownloadReport: (format: 'pdf' | 'excel') => void;
  onViewDetails: () => void;
  onNewImport: () => void;
}

interface ImportSummary {
  importName: string;
  importDate: string;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  skippedRecords: number;
  totalImportedValue: number;
  expectedTotalValue: number;
  variance: number;
  variancePercentage: number;
  duration: number;
  errors: ImportError[];
}

// UI Features:
- Summary cards
- Success/failure statistics
- Value verification
- Error list
- Download report button
- View details button
- New import button
```

### 6. Import History Component

```typescript
interface ImportHistoryProps {
  imports: OpeningBalanceImport[];
  onViewDetails: (importId: string) => void;
  onReimport: (importId: string) => void;
  onDelete: (importId: string) => void;
  onExport: (importId: string, format: 'excel' | 'pdf') => void;
}

// Features:
- List of all imports
- Filter by date, status, user
- Sort by date, value, status
- View import details
- Re-import from history
- Delete import record
- Export import report
- Pagination
```

## Template Structure

### Simple Template (6 fields)

| Column | Description | Required | Format |
|--------|-------------|----------|--------|
| product_code | Product code | Yes | Text, max 50 chars |
| product_name | Product name | Yes | Text, max 255 chars |
| opening_quantity | Opening quantity | Yes | Number, > 0 |
| unit_cost | Unit cost | Yes | Number, > 0 |
| category | Product category | No | Text |
| notes | Notes | No | Text |

### Complete Template (10 fields)

| Column | Description | Required | Format |
|--------|-------------|----------|--------|
| product_code | Product code | Yes | Text, max 50 chars |
| product_name | Product name | Yes | Text, max 255 chars |
| opening_quantity | Opening quantity | Yes | Number, > 0 |
| unit_cost | Unit cost | Yes | Number, > 0 |
| category | Product category | No | Text |
| supplier_name | Supplier name | No | Text |
| storage_location | Storage location | No | Text |
| batch_number | Batch number | No | Text |
| expiry_date | Expiry date | No | Date (YYYY-MM-DD) |
| notes | Notes | No | Text |

### Template with Suppliers (12 fields)

Includes all complete template fields plus:
- supplier_code
- supplier_contact
- supplier_email

## Import Workflow

### Step 1: Upload File
1. User selects template type
2. Downloads template (optional)
3. Fills in data
4. Uploads file
5. System parses file

### Step 2: Validate Data
1. System validates each row
2. Checks required fields
3. Validates data types
4. Checks for duplicates
5. Verifies product codes (optional)
6. Generates error report

### Step 3: Preview Data
1. Display validated data
2. Show summary statistics
3. Verify total value
4. Highlight errors/warnings
5. Allow manual corrections

### Step 4: Import
1. User confirms import
2. System processes batch
3. Creates inventory records
4. Updates product balances
5. Logs import details
6. Generates summary

### Step 5: Summary
1. Display import results
2. Show success/failure counts
3. Display value verification
4. List errors with details
5. Provide download report option
6. Save to import history

## API Endpoints

```typescript
// Upload and validate file
POST /api/opening-balance/upload
Body: FormData (file)
Response: { importId: string, validationResults: ValidationResult }

// Preview data
GET /api/opening-balance/preview/:importId
Response: { data: OpeningBalanceRow[], summary: ImportSummary }

// Import data
POST /api/opening-balance/import/:importId
Body: { options: ImportOptions }
Response: { importId: string, summary: ImportSummary }

// Get import history
GET /api/opening-balance/history
Query Params: { companyId, branchId, status, dateFrom, dateTo }
Response: { imports: OpeningBalanceImport[] }

// Get import details
GET /api/opening-balance/:importId
Response: { import: OpeningBalanceImport, details: OpeningBalanceImportDetail[] }

// Download template
GET /api/opening-balance/template/:type
Response: File (Excel)

// Download import report
GET /api/opening-balance/:importId/report/:format
Response: File (PDF or Excel)

// Delete import
DELETE /api/opening-balance/:importId
Response: { success: boolean }
```

## TypeScript Type Definitions

```typescript
export interface OpeningBalanceImport {
  id: string;
  company_id: string;
  branch_id?: string;
  user_id?: string;
  import_name: string;
  import_date: string;
  import_type: 'initial' | 'adjustment' | 'correction';
  file_name: string;
  file_size?: number;
  file_url?: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  skipped_records: number;
  total_imported_value: number;
  expected_total_value?: number;
  variance: number;
  variance_percentage: number;
  import_status: 'pending' | 'validating' | 'previewing' | 'importing' | 'completed' | 'failed' | 'cancelled';
  notes?: string;
  error_summary: Record<string, any>;
  created_at: string;
  completed_at?: string;
  created_by?: string;
}

export interface OpeningBalanceImportDetail {
  id: string;
  import_id: string;
  product_id?: string;
  product_code: string;
  product_name: string;
  opening_quantity: number;
  unit_cost: number;
  total_value: number;
  import_status: 'pending' | 'imported' | 'failed' | 'skipped';
  error_message?: string;
  error_code?: string;
  notes?: string;
  category?: string;
  supplier_name?: string;
  created_at: string;
}

export interface OpeningBalanceRow {
  productCode: string;
  productName: string;
  quantity: number;
  unitCost: number;
  category?: string;
  supplierName?: string;
  storageLocation?: string;
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
}

export interface ImportOptions {
  createMissingProducts: boolean;
  updateExistingProducts: boolean;
  skipDuplicates: boolean;
  verifyTotalValue: boolean;
  expectedTotalValue?: number;
}
```

## Implementation Phases

### Phase 1: Database Schema (Week 1)
- Create migration file
- Add opening_balance_imports table
- Add opening_balance_import_details table
- Add indexes and constraints
- Test migration locally

### Phase 2: Service Layer (Week 1-2)
- Create opening balance service
- Implement file upload and parsing
- Implement validation logic
- Implement import processing
- Add import history functions
- Add export functions

### Phase 3: UI Components (Week 2-3)
- Create opening balance import component
- Create template download component
- Create data validation component
- Create import progress component
- Create import summary component
- Create import history component

### Phase 4: Integration (Week 3)
- Integrate components into settings page
- Connect to service layer
- Implement form validation
- Add error handling
- Add loading states
- Test complete flow

### Phase 5: Polish & Testing (Week 3-4)
- Responsive design testing
- Performance optimization
- Accessibility improvements
- User acceptance testing
- Bug fixes and refinements

### Phase 6: Documentation (Week 4)
- Create user guide
- Add template documentation
- Update API documentation
- Create import workflow guide
- Update help documentation

## Testing Strategy

### Unit Tests
- Test file parsing (Excel/CSV)
- Test validation logic
- Test import processing
- Test balance verification
- Test error handling

### Integration Tests
- Test complete import workflow
- Test database operations
- Test file upload/download
- Test import history

### Manual Testing
- Test template download
- Test file upload
- Test data validation
- Test import processing
- Test import summary
- Test import history

### Performance Tests
- Test large file imports (1000+ rows)
- Test concurrent imports
- Test file parsing performance
- Test database batch operations

## Success Metrics

### User Engagement
- Increase opening balance import usage by 50%
- Reduce import time by 40%
- Increase template usage by 60%
- Reduce error rate by 30%

### Data Quality
- Increase data accuracy by 35%
- Reduce balance discrepancies by 45%
- Increase validation compliance by 40%

### User Experience
- Increase user satisfaction with import flow
- Reduce support requests for imports
- Increase self-service import rate

## Risks & Mitigations

### Risk 1: File Parsing Issues
**Mitigation:** Robust parsing library, error handling, multiple format support

### Risk 2: Validation Complexity
**Mitigation:** Clear validation rules, helpful error messages, fix suggestions

### Risk 3: Large File Performance
**Mitigation:** Batch processing, progress tracking, pagination, streaming

### Risk 4: Balance Discrepancies
**Mitigation:** Value verification, variance calculation, manual review option

### Risk 5: Data Loss
**Mitigation:** Transaction safety, rollback capability, import history

## Conclusion

The settings opening balance import design provides a comprehensive solution for importing initial inventory balances. The step-by-step wizard approach reduces errors and improves user experience while the template system ensures data consistency.

Key benefits include:
- Clear import workflow with validation
- Template system for data consistency
- Comprehensive error handling
- Import history for audit trail
- Balance verification for accuracy
- Progress tracking for visibility
- Detailed import reports

The implementation is estimated to take 4 weeks with proper testing and documentation.
