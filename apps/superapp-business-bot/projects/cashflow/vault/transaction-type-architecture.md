# Transaction Type Architecture - Enhanced Design

**Date:** 2026-04-27
**Status:** Design Document
**Purpose:** Define strict transaction type logic to prevent data inconsistency

## Current Issues

### 1. Fallback Logic Inconsistency
- **Location:** `src/services/database.ts` lines 150-155
- **Problem:** Hardcoded `baseTypes` as fallback when database query fails
- **Impact:** Transaction types "disappear" or "appear" based on database query success
- **Root Cause:** No proper error handling and data validation

### 2. Hardcoded UI Components
- **Location:** `src/components/UI/TransactionTypeFilter.tsx` lines 37-43
- **Problem:** Component has hardcoded transaction types instead of loading from database
- **Impact:** UI inconsistency with Settings page
- **Root Cause:** Component not connected to database service

### 3. Database Schema Constraints Missing
- **Location:** `supabase/migrations/006_multi_tenancy_company_id.sql`
- **Problem:** 
  - No unique constraint on `transaction_types.id`
  - No foreign key from `transactions.transaction_type` to `transaction_types.id`
  - No cascade delete protection
- **Impact:** Can create duplicate transaction types, orphan transactions
- **Root Cause:** Schema design incomplete

### 4. Delete Validation Missing
- **Problem:** No check if transaction type is in use before deletion
- **Impact:** Can delete types with active transactions → data corruption
- **Root Cause:** No referential integrity validation

### 5. Import Validation Missing
- **Problem:** Import can create transactions with non-existent types
- **Impact:** Invalid data in database
- **Root Cause:** No server-side validation during import

## Enhanced Architecture Design

### 1. Database Schema Enhancements

#### Add Unique Constraint on transaction_types.id
```sql
-- Ensure transaction type IDs are globally unique
ALTER TABLE public.transaction_types
ADD CONSTRAINT transaction_types_id_unique UNIQUE (id);
```

#### Add Foreign Key Constraint
```sql
-- Ensure transactions.transaction_type references valid transaction_types
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_transaction_type_fkey
FOREIGN KEY (transaction_type) 
REFERENCES public.transaction_types(id) 
ON DELETE RESTRICT;
```

#### Add Composite Unique Constraint
```sql
-- Ensure (company_id, id) is unique for proper multi-tenancy
ALTER TABLE public.transaction_types
DROP CONSTRAINT IF EXISTS transaction_types_company_id_name_key;
ALTER TABLE public.transaction_types
ADD CONSTRAINT transaction_types_company_id_id_key UNIQUE (company_id, id);
```

### 2. Service Layer Validation

#### Transaction Type Service Rules
```typescript
const transactionTypeService = {
  // STRICT: No fallback to hardcoded types
  async getTransactionTypes(companyId?: string) {
    // MUST query database
    // MUST throw error if database unavailable
    // MUST validate data structure
    // MUST return only active types
  },

  // STRICT: Validate before creation
  async createTransactionType(data: TransactionType) {
    // MUST check duplicate id
    // MUST check duplicate name within company
    // MUST validate math_factor is -1 or 1
    // MUST validate impact_type is 'increase' or 'decrease'
    // MUST validate color is valid
  },

  // STRICT: Validate before deletion
  async deleteTransactionType(id: string, companyId: string) {
    // MUST check if type is used in any transactions
    // MUST prevent deletion if in use
    // MUST implement soft delete with is_active flag
  },

  // STRICT: Validate before update
  async updateTransactionType(id: string, data: Partial<TransactionType>) {
    // MUST check if type exists
    // MUST prevent changing id if in use
    // MUST validate all fields
  }
};
```

### 3. UI Component Architecture

#### Transaction Type Filter Component
```typescript
// MUST load transaction types from database
// MUST use databaseService.transactionTypes.getTransactionTypes()
// MUST show loading state
// MUST show error state
// MUST NOT have hardcoded types
// MUST refresh when transaction types change
```

#### Transaction Type Display Components
```typescript
// MUST use centralized transaction type service
// MUST cache transaction types with proper invalidation
// MUST handle missing types gracefully
// MUST use consistent label resolution
```

### 4. Import Validation

#### Transaction Import Validation
```typescript
async validateTransactionImport(transactions: TransactionImport[]) {
  // MUST validate each transaction type exists
  // MUST reject import if any type is invalid
  // MUST provide clear error messages
  // MUST prevent partial imports with invalid types
}
```

### 5. Error Handling Strategy

#### Database Unavailable
```typescript
// MUST show user-friendly error
// MUST NOT fallback to hardcoded data
// MUST provide retry mechanism
// MUST log error for debugging
```

#### Invalid Transaction Type
```typescript
// MUST prevent creation
// MUST show clear error message
// MUST suggest valid types
// MUST log validation failure
```

## Implementation Plan

### Phase 1: Database Schema (Critical)
1. Add unique constraint on `transaction_types.id`
2. Add foreign key constraint from `transactions.transaction_type` to `transaction_types.id`
3. Add proper indexes for performance
4. Create migration script

### Phase 2: Service Layer (Critical)
1. Remove hardcoded `baseTypes` fallback
2. Implement strict validation in `createTransactionType`
3. Implement usage check in `deleteTransactionType`
4. Add proper error handling
5. Implement soft delete with `is_active` flag

### Phase 3: UI Components (High)
1. Update `TransactionTypeFilter` to load from database
2. Update all components using transaction types to use service
3. Add loading and error states
4. Implement proper caching with invalidation

### Phase 4: Import Validation (High)
1. Add transaction type validation in import
2. Reject imports with invalid types
3. Provide clear error messages
4. Add batch validation before import

### Phase 5: Testing (Critical)
1. Unit tests for service layer validation
2. Integration tests for database constraints
3. UI tests for component behavior
4. Import tests for validation logic
5. Edge case tests for delete operations

## Validation Rules

### Transaction Type Creation
- ✅ ID must be unique globally
- ✅ Name must be unique within company
- ✅ Math factor must be -1 or 1
- ✅ Impact type must be 'increase' or 'decrease'
- ✅ Color must be valid CSS color
- ✅ Company ID must be valid

### Transaction Type Deletion
- ✅ Must check if type is used in transactions
- ✅ Must prevent deletion if in use
- ✅ Must use soft delete (set is_active = false)
- ✅ Must log deletion for audit

### Transaction Type Update
- ✅ Must prevent changing ID if type is in use
- ✅ Must validate all fields
- ✅ Must maintain referential integrity

### Transaction Import
- ✅ Must validate transaction type exists
- ✅ Must reject entire batch if any type invalid
- ✅ Must provide clear error messages
- ✅ Must prevent partial imports

## Error Messages

### Database Unavailable
```
Không thể tải loại giao dịch. Vui lòng kiểm tra kết nối mạng và thử lại.
```

### Invalid Transaction Type
```
Loại giao dịch "{type}" không tồn tại. Vui lòng chọn loại giao dịch hợp lệ.
```

### Cannot Delete In-Use Type
```
Không thể xóa loại giao dịch "{type}" vì đang được sử dụng trong {count} giao dịch.
```

### Duplicate Transaction Type
```
Loại giao dịch "{name}" đã tồn tại. Vui lòng chọn tên khác.
```

## Monitoring

### Metrics to Track
- Transaction type creation success rate
- Transaction type deletion attempts (blocked vs successful)
- Import validation failures by type
- Database query performance
- Cache hit rate for transaction types

### Alerts
- Database query failures
- Duplicate transaction type attempts
- Deletion of in-use types
- Import validation failures

## Rollback Plan

### If Issues Occur
1. Revert database schema changes
2. Restore previous service layer code
3. Revert UI component changes
4. Monitor for data corruption
5. Communicate with users

## Success Criteria

- ✅ No hardcoded transaction types in UI
- ✅ Database constraints prevent duplicates
- ✅ Cannot delete transaction types in use
- ✅ Import validates transaction types
- ✅ Consistent transaction type display across all components
- ✅ Proper error handling and user feedback
- ✅ Comprehensive test coverage
- ✅ No data corruption scenarios

## Lessons Learned

### What Went Wrong
1. Fallback logic masked database issues
2. Hardcoded values in components
3. Missing database constraints
4. No validation at service layer
5. Inconsistent data loading patterns

### What to Do Differently
1. NEVER use hardcoded fallbacks for critical data
2. ALWAYS load from single source of truth
3. IMPLEMENT database constraints for data integrity
4. VALIDATE at service layer before database operations
5. USE consistent data loading patterns across components
6. TEST edge cases thoroughly before deployment
