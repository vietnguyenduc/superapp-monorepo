# Import Flow Improvements Design

## Overview

This document outlines the design for improving the import flow in the inventory-operation application. The enhancements include distinguishing between advanced single entry and bulk import modes, implementing a step-by-step guided import wizard, and improving the overall user experience for data import operations.

## Current State Analysis

### Existing Import Flows

**Product Import (ProductBulkImportComplete.tsx):**
- Single bulk import mode with editable grid
- 12-field complete data structure
- Real-time validation per row
- Paste from clipboard support
- No guided flow
- No step-by-step process
- Limited error feedback

**Inventory Import (InventoryImport.tsx):**
- Basic import functionality
- Limited field structure
- No guided flow
- No step-by-step process

### Cashflow Import Reference

**Features to Adapt:**
- Single vs bulk import mode selection
- Step-by-step import wizard
- Template download with examples
- Data preview before import
- Validation feedback with error highlighting
- Progress tracking during import
- Import summary with success/failure counts
- Error report generation

## Design Goals

1. **Mode Selection**: Clear distinction between single entry (advanced) and bulk import
2. **Guided Wizard**: Step-by-step import process with clear progress
3. **Template System**: Downloadable templates with examples and validation rules
4. **Data Preview**: Review data before committing to import
5. **Enhanced Validation**: Real-time validation with clear error messages
6. **Progress Tracking**: Visual progress indicator during import
7. **Import Summary**: Detailed summary of import results
8. **Error Reporting**: Comprehensive error reports with fix suggestions

## Import Mode Design

### Mode 1: Single Entry (Advanced)

**Purpose:** Import one product at a time with full control and validation

**Use Cases:**
- Adding new products individually
- Editing existing products
- Complex product configurations
- Products requiring special attention

**Features:**
- Multi-step form wizard
- Field-by-field validation
- Real-time feedback
- Save as draft
- Preview before submit
- Duplicate detection
- Supplier lookup
- Category management

**Wizard Steps:**
1. **Basic Information** - Name, code, category
2. **Quantities & Units** - Input/output quantities, units
3. **Supplier & Pricing** - Supplier selection, cost/selling price
4. **Inventory Settings** - Stock levels, reorder point, lead time
5. **Tracking Options** - Barcode, SKU, batch/serial tracking
6. **Review & Submit** - Preview all data, confirm import

### Mode 2: Bulk Import

**Purpose:** Import multiple products from Excel/CSV file

**Use Cases:**
- Initial product catalog setup
- Mass updates to existing products
- Regular data imports from external systems
- Large-scale product additions

**Features:**
- File upload (Excel/CSV)
- Template download
- Data preview table
- Column mapping
- Validation report
- Error highlighting
- Batch processing
- Progress indicator
- Import summary

**Wizard Steps:**
1. **Upload File** - Select file, choose template
2. **Map Columns** - Map file columns to system fields
3. **Validate Data** - Run validation, review errors
4. **Preview Data** - Review data before import
5. **Import** - Process import with progress tracking
6. **Summary** - View import results and error report

## Component Design

### 1. Import Mode Selector

```typescript
interface ImportModeSelectorProps {
  onModeSelect: (mode: 'single' | 'bulk') => void;
  disabled?: boolean;
}

// UI Design
┌─────────────────────────────────────────┐
│ Choose Import Mode                       │
├─────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────┐│
│ │  Single Entry       │ │  Bulk Import ││
│ │  (Advanced)         │ │              ││
│ │                     │ │              ││
│ │  Import one product │ │  Import from ││
│ │  at a time with     │ │  Excel/CSV   ││
│ │  full control       │ │  file        ││
│ │                     │ │              ││
│ │  Best for:          │ │  Best for:   ││
│ │  - New products     │ │  - Mass add  ││
│ │  - Complex configs  │ │  - Updates   ││
│ │  - Special items    │ │  - Setup     ││
│ └─────────────────────┘ └─────────────┘│
└─────────────────────────────────────────┘
```

### 2. Single Entry Wizard

```typescript
interface SingleEntryWizardProps {
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  suppliers: Supplier[];
  categories: string[];
  loading: boolean;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  validation: (data: any) => { valid: boolean; errors: string[] };
}

const wizardSteps: WizardStep[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Enter the basic product details',
    component: BasicInfoStep,
    validation: validateBasicInfo
  },
  {
    id: 'quantities',
    title: 'Quantities & Units',
    description: 'Define quantities and measurement units',
    component: QuantitiesStep,
    validation: validateQuantities
  },
  {
    id: 'supplier',
    title: 'Supplier & Pricing',
    description: 'Select supplier and set pricing',
    component: SupplierStep,
    validation: validateSupplier
  },
  {
    id: 'inventory',
    title: 'Inventory Settings',
    description: 'Configure inventory management settings',
    component: InventoryStep,
    validation: validateInventory
  },
  {
    id: 'tracking',
    title: 'Tracking Options',
    description: 'Set up tracking and identification',
    component: TrackingStep,
    validation: validateTracking
  },
  {
    id: 'review',
    title: 'Review & Submit',
    description: 'Review all information before importing',
    component: ReviewStep,
    validation: () => ({ valid: true, errors: [] })
  }
];
```

**Wizard UI:**
```
┌─────────────────────────────────────────────────────────┐
│ Import Product - Single Entry            Step 1 of 6     │
├─────────────────────────────────────────────────────────┤
│ Progress: [████░░░░░░░░░] 16%                           │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Step 1: Basic Information                            │ │
│ │ Enter the basic product details                       │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │                                                       │ │
│ │ Product Name: [_________________________] *          │ │
│ │ Product Code: [_________________________] *          │ │
│ │ Category:     [Dropdown ▼] *                         │ │
│ │ Tags:         [Add Tag] [Tag1] [Tag2] [x]            │ │
│ │                                                       │ │
│ │ Notes:        [_________________________]             │ │
│ │               [_________________________]             │ │
│ │                                                       │ │
│ │ [Previous] [Next] [Cancel] [Save Draft]              │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 3. Bulk Import Wizard

```typescript
interface BulkImportWizardProps {
  onSubmit: (data: BulkImportData) => Promise<void>;
  onCancel: () => void;
  templates: ImportTemplate[];
  loading: boolean;
}

interface BulkImportData {
  file: File;
  templateId: string;
  columnMapping: Record<string, string>;
  validationResults: ValidationResult;
  previewData: any[];
}

interface ImportTemplate {
  id: string;
  name: string;
  description: string;
  fields: TemplateField[];
  downloadUrl: string;
  exampleData: any[];
}

interface TemplateField {
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'number' | 'date' | 'dropdown';
  options?: string[];
  validation?: string;
}
```

**Wizard Steps:**

#### Step 1: Upload File
```
┌─────────────────────────────────────────────────────────┐
│ Bulk Import - Upload File              Step 1 of 6       │
├─────────────────────────────────────────────────────────┤
│ Progress: [██░░░░░░░░░░] 16%                             │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Select Template                                      │ │
│ │                                                       │ │
│ │ ○ Complete Product Template (12 fields)              │ │
│ │   All product fields including pricing and tracking  │ │
│ │                                                       │ │
│ │ ○ Simple Product Template (6 fields)                 │ │
│ │   Essential fields only                              │ │
│ │                                                       │ │
│ │ ○ Custom Template                                    │ │
│ │   Upload your own template                           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Upload File                                         │ │
│ │                                                       │ │
│ │ [Drag & drop file here or click to browse]          │ │
│ │                                                       │ │
│ │ Supported formats: .xlsx, .csv, .xls               │ │
│ │ Max file size: 10MB                                 │ │
│ │                                                       │ │
│ │ [Download Template] [View Example Data]              │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [Cancel] [Next]                                         │
└─────────────────────────────────────────────────────────┘
```

#### Step 2: Map Columns
```
┌─────────────────────────────────────────────────────────┐
│ Bulk Import - Map Columns               Step 2 of 6       │
├─────────────────────────────────────────────────────────┤
│ Progress: [████░░░░░░░░] 33%                            │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Column Mapping                                      │ │
│ │ Map your file columns to system fields               │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │                                                       │ │
│ │ File Column          →  System Field                │ │
│ │ ─────────────────────────────────────────────────  │ │
│ │ Product Name        →  name [✓]                     │ │
│ │ Product Code        →  business_code [✓]            │ │
│ │ Material Type       →  category [✓]                 │ │
│ │ Input Quantity      →  input_quantity [✓]           │ │
│ │ Output Quantity     →  output_quantity [✓]          │ │
│ │ Supplier            →  supplier_id [?]              │ │
│ │ Price               →  [Skip Column]                │ │
│ │ Notes               →  notes [✓]                    │ │
│ │                                                       │ │
│ │ [Auto-Map] [Reset Mapping]                          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [Previous] [Next] [Cancel]                              │
└─────────────────────────────────────────────────────────┘
```

#### Step 3: Validate Data
```
┌─────────────────────────────────────────────────────────┐
│ Bulk Import - Validate Data              Step 3 of 6       │
├─────────────────────────────────────────────────────────┤
│ Progress: [██████░░░░░░] 50%                            │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Validation Results                                   │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │                                                       │ │
│ │ Total Rows: 150                                     │ │
│ │ Valid Rows: 142 ✓                                   │ │
│ │ Invalid Rows: 8 ✗                                   │ │
│ │                                                       │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ Errors Found                                     │ │ │
│ │ ├─────────────────────────────────────────────────┤ │ │
│ │ │ Row 5: Missing required field "product_code"   │ │ │
│ │ │ Row 12: Invalid quantity (must be positive)     │ │ │
│ │ │ Row 23: Duplicate product code "NVL001"         │ │ │
│ │ │ Row 45: Invalid email format for supplier       │ │ │
│ │ │ Row 67: Missing required field "name"           │ │ │
│ │ │ Row 89: Invalid category "unknown"              │ │ │
│ │ │ Row 112: Invalid date format                    │ │ │
│ │ │ Row 134: Supplier not found "SUP999"            │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ │                                                       │ │
│ │ [Fix Errors] [Import Valid Only] [Import All]       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [Previous] [Next] [Cancel]                              │
└─────────────────────────────────────────────────────────┘
```

#### Step 4: Preview Data
```
┌─────────────────────────────────────────────────────────┐
│ Bulk Import - Preview Data                Step 4 of 6       │
├─────────────────────────────────────────────────────────┤
│ Progress: [████████░░░░] 66%                            │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Data Preview (First 10 rows)                        │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │                                                       │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ Name    | Code  | Category | Qty  | Supplier   │ │ │
│ │ ├─────────────────────────────────────────────────┤ │ │
│ │ │ Cam     | NVL001| Raw Mat  | 100  | Supplier A │ │ │
│ │ │ Nho     | NVL002| Raw Mat  | 200  | Supplier B │ │ │
│ │ │ Tra     | NVL003| Raw Mat  | 150  | Supplier A │ │ │
│ │ │ ...     | ...   | ...      | ...  | ...        │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ │                                                       │ │
│ │ Showing 10 of 142 valid rows                         │ │
│ │ [View All Rows] [Filter by Error]                    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [Previous] [Next] [Cancel]                              │
└─────────────────────────────────────────────────────────┘
```

#### Step 5: Import
```
┌─────────────────────────────────────────────────────────┐
│ Bulk Import - Import Data                  Step 5 of 6       │
├─────────────────────────────────────────────────────────┤
│ Progress: [██████████░░] 83%                            │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Importing Data...                                   │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │                                                       │ │
│ │ Progress: [████████░░░░░░░░░░░] 60%                 │ │
│ │                                                       │ │
│ │ Processed: 85 of 142 rows                           │ │
│ │ Imported: 80 ✓                                      │ │
│ │ Failed: 5 ✗                                         │ │
│ │                                                       │ │
│ │ Current: Processing row 85...                        │ │
│ │                                                       │ │
│ │ [Cancel Import]                                      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [Previous] [Next] [Cancel]                              │
└─────────────────────────────────────────────────────────┘
```

#### Step 6: Summary
```
┌─────────────────────────────────────────────────────────┐
│ Bulk Import - Import Summary              Step 6 of 6       │
├─────────────────────────────────────────────────────────┤
│ Progress: [████████████] 100%                           │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Import Complete                                      │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │                                                       │ │
│ │ Total Rows: 150                                     │ │
│ │ Valid Rows: 142                                     │ │
│ │                                                       │ │
│ │ Results:                                            │ │
│ │ ✓ Successfully Imported: 137                        │ │
│ │ ✗ Failed: 5                                        │ │
│ │ ⚠ Skipped: 8 (validation errors)                   │ │
│ │                                                       │ │
│ │ [View Error Report] [Download Error CSV]             │ │
│ │ [View Imported Products] [Download Import Log]       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [Import More] [Finish] [Cancel]                         │
└─────────────────────────────────────────────────────────┘
```

### 4. Template Management Component

```typescript
interface TemplateManagementProps {
  templates: ImportTemplate[];
  onCreateTemplate: (template: ImportTemplate) => Promise<void>;
  onUpdateTemplate: (id: string, template: Partial<ImportTemplate>) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
  onDownloadTemplate: (id: string) => void;
}

// Features:
- List available templates
- Create custom templates
- Edit existing templates
- Delete templates
- Download template with example data
- Preview template structure
```

### 5. Validation Engine

```typescript
interface ValidationEngine {
  validateRow(row: any, schema: ValidationSchema): ValidationResult;
  validateBatch(data: any[], schema: ValidationSchema): BatchValidationResult;
  generateErrorReport(errors: ValidationError[]): ErrorReport;
  suggestFix(error: ValidationError): FixSuggestion;
}

interface ValidationSchema {
  fields: FieldValidation[];
  rules: ValidationRule[];
}

interface FieldValidation {
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'number' | 'date' | 'email' | 'dropdown';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  options?: string[];
  customValidator?: (value: any) => { valid: boolean; message?: string };
}

interface ValidationResult {
  valid: boolean;
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
- Required field validation
- Data type validation
- Format validation (email, date, etc.)
- Range validation (min/max values)
- Uniqueness validation (duplicate detection)
- Reference validation (foreign keys)
- Business rule validation (custom logic)

### 6. Progress Tracker Component

```typescript
interface ProgressTrackerProps {
  currentStep: number;
  totalSteps: number;
  stepNames: string[];
  completedSteps: number[];
  onStepClick?: (step: number) => void;
}

// UI Design:
Step 1 [✓] → Step 2 [✓] → Step 3 [•] → Step 4 [ ] → Step 5 [ ]
```

## Template System

### Standard Templates

#### 1. Complete Product Template
**Fields:** 12 fields including all product attributes
**Use Case:** Full product catalog import
**Example Data:** 5 sample products with all fields populated

#### 2. Simple Product Template
**Fields:** 6 essential fields (name, code, category, quantities, units)
**Use Case:** Quick product additions
**Example Data:** 5 sample products with essential fields

#### 3. Inventory Update Template
**Fields:** Product code, quantity adjustments, notes
**Use Case:** Bulk inventory updates
**Example Data:** 5 sample inventory adjustments

#### 4. Price Update Template
**Fields:** Product code, cost price, selling price, margin
**Use Case:** Bulk price updates
**Example Data:** 5 sample price updates

### Custom Templates

Users can create custom templates by:
- Selecting fields from available options
- Setting field requirements
- Adding validation rules
- Saving template for reuse
- Sharing template with team

## Error Handling

### Error Types

1. **Validation Errors**
   - Missing required fields
   - Invalid data formats
   - Out of range values
   - Pattern mismatches

2. **Business Logic Errors**
   - Duplicate records
   - Invalid references
   - Constraint violations
   - Business rule violations

3. **System Errors**
   - File parsing errors
   - Database errors
   - Network errors
   - Timeout errors

### Error Recovery

- **Auto-fix:** Automatically fix common errors (trim whitespace, normalize dates)
- **Suggestions:** Provide fix suggestions for each error
- **Batch Fix:** Apply fixes to multiple similar errors
- **Manual Fix:** Allow users to edit data directly in preview
- **Skip Option:** Allow importing valid rows only
- **Retry:** Retry failed operations

## Import Logging

### Import Log Entry

```typescript
interface ImportLog {
  id: string;
  importType: 'single' | 'bulk';
  templateId?: string;
  fileName?: string;
  userId: string;
  companyId: string;
  
  // Results
  totalRows: number;
  validRows: number;
  importedRows: number;
  failedRows: number;
  skippedRows: number;
  
  // Timing
  startedAt: string;
  completedAt: string;
  duration: number; // in seconds
  
  // Details
  errors: ImportError[];
  warnings: ImportWarning[];
  
  // File
  fileUrl?: string;
  errorReportUrl?: string;
}
```

### Import History

Users can view:
- All import operations
- Import results summary
- Error reports
- Download original files
- Re-run failed imports
- Undo imports (with permission)

## Implementation Phases

### Phase 1: Mode Selection & Wizard Framework (Week 1)
- Create import mode selector component
- Build wizard framework with step navigation
- Implement progress tracker
- Create wizard step base component
- Test wizard navigation

### Phase 2: Single Entry Wizard (Week 2)
- Create single entry wizard steps
- Implement form validation per step
- Add draft save functionality
- Implement supplier lookup
- Add category management
- Test complete wizard flow

### Phase 3: Bulk Import Wizard - File Upload (Week 2-3)
- Create file upload component
- Implement template download
- Add file parsing (Excel/CSV)
- Create template management
- Test file upload and parsing

### Phase 4: Bulk Import Wizard - Column Mapping (Week 3)
- Create column mapping component
- Implement auto-mapping logic
- Add manual mapping support
- Create custom template builder
- Test column mapping

### Phase 5: Bulk Import Wizard - Validation (Week 3-4)
- Create validation engine
- Implement field validators
- Add business rule validation
- Create error highlighting
- Implement fix suggestions
- Test validation logic

### Phase 6: Bulk Import Wizard - Preview & Import (Week 4)
- Create data preview component
- Implement batch processing
- Add progress tracking
- Create import summary
- Implement error reporting
- Test complete import flow

### Phase 7: Import Logging & History (Week 4-5)
- Create import log service
- Implement import history view
- Add error report generation
- Implement undo functionality
- Test logging and history

### Phase 8: Polish & Testing (Week 5)
- Responsive design testing
- Performance optimization
- Accessibility improvements
- User acceptance testing
- Bug fixes and refinements

### Phase 9: Documentation (Week 5-6)
- Create user guide
- Add template documentation
- Update API documentation
- Create video tutorials
- Update help documentation

## Testing Strategy

### Unit Tests
- Test validation engine
- Test wizard navigation
- Test file parsing
- Test column mapping
- Test error handling

### Integration Tests
- Test complete import flows
- Test database operations
- Test file upload/download
- Test import logging

### Manual Testing
- Test single entry wizard
- Test bulk import wizard
- Test template system
- Test error recovery
- Test import history

### Performance Tests
- Test large file imports (1000+ rows)
- Test concurrent imports
- Test file parsing performance
- Test database batch operations

## Success Metrics

### User Engagement
- Increase import success rate by 40%
- Reduce import time by 50%
- Increase template usage by 60%
- Reduce error rate by 30%

### Data Quality
- Increase data accuracy by 35%
- Reduce duplicate imports by 50%
- Increase validation compliance by 45%

### User Experience
- Increase user satisfaction with import flow
- Reduce support requests for imports
- Increase self-service import rate

## Risks & Mitigations

### Risk 1: File Parsing Issues
**Mitigation:** Robust parsing library, error handling, multiple format support

### Risk 2: Validation Complexity
**Mitigation:** Modular validation rules, clear error messages, fix suggestions

### Risk 3: Large File Performance
**Mitigation:** Batch processing, progress tracking, pagination, streaming

### Risk 4: User Confusion
**Mitigation:** Clear wizard steps, help text, video tutorials, onboarding tour

## Conclusion

The import flow improvements provide a significant enhancement over the current implementation by adding mode selection, guided wizards, template system, and comprehensive validation. The step-by-step approach reduces errors and improves user experience while the template system ensures data consistency.

Key benefits include:
- Clear distinction between single and bulk import
- Guided wizard reduces errors and improves UX
- Template system ensures data consistency
- Comprehensive validation catches errors early
- Progress tracking provides visibility
- Import logging enables audit trail
- Error reporting helps fix issues quickly

The implementation is estimated to take 6 weeks with proper testing and documentation.
