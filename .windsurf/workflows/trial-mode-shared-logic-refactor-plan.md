---
description: Plan to refactor trial mode to use shared business logic with real mode
---

# Trial Mode Shared Business Logic Refactor Plan

## Objective
Ensure trial mode and real mode use the **same business logic functions**, only differing in data source (localStorage vs Supabase).

## Current Problem Analysis

### Issue
Each service has **duplicate implementation**:
- **Trial mode**: Separate logic using `trialGet`, `trialInsert`, `trialUpdate`, `trialDelete`
- **Real mode**: Separate logic using Supabase calls

### Impact
- Bug fixes in real mode don't apply to trial mode
- Validation logic differs between modes
- Business logic differs (e.g., dashboard metrics)
- Feature additions need to be implemented twice
- Maintenance burden doubled

### Example: `bulkCreateCustomers`
```typescript
// Trial mode (lines 1106-1172) - Separate validation, mapping
if (getTrialMode()) {
  const now = getNowIso();
  const body = (_customers || []).map(raw => ({
    id: raw.id || `cust-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    customer_code: raw.customer_code || `CUST${Date.now().toString().slice(-4)}_${Math.random().toString(36).slice(2, 5)}`,
    // ... validation and mapping logic
  }));
  // localStorage operations
}

// Real mode (lines 1173-1209) - Separate validation, mapping
else {
  const now = getNowIso();
  const body = (_customers || []).map(raw => ({
    id: raw.id || crypto.randomUUID(),
    customer_code: raw.customer_code || generateCustomerCode(),
    // ... different validation and mapping logic
  }));
  // Supabase operations
}
```

## Architecture Design

### Proposed Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   UI Components                           │
│              (React pages, hooks)                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Service Layer (database.ts)                 │
│  - Orchestrates data operations                          │
│  - Handles error responses                               │
│  - Manages data source selection                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         Shared Business Logic Layer (NEW)                │
│  - Pure functions for validation                         │
│  - Pure functions for data transformation                 │
│  - Pure functions for calculations                        │
│  - No data source dependencies                            │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌────────────────┐      ┌────────────────┐
│ Data Abstraction│      │ Data Abstraction│
│   (localStorage)│      │   (Supabase)     │
└────────────────┘      └────────────────┘
```

### Data Abstraction Layer

```typescript
// NEW: src/services/dataAdapter.ts

interface DataAdapter {
  // CRUD operations
  get<T>(table: string, filters?: any): Promise<T[]>;
  getById<T>(table: string, id: string): Promise<T | null>;
  insert<T>(table: string, data: T): Promise<T>;
  update<T>(table: string, id: string, data: Partial<T>): Promise<T>;
  delete(table: string, id: string): Promise<void>;
  
  // Query operations
  query<T>(table: string, query: any): Promise<T[]>;
  count(table: string, filters?: any): Promise<number>;
}

class LocalStorageAdapter implements DataAdapter {
  // Implementation using localStorage/trialMockStore
}

class SupabaseAdapter implements DataAdapter {
  // Implementation using Supabase client
}
```

### Shared Business Logic Layer

```typescript
// NEW: src/services/businessLogic.ts

// Validation functions (pure, no data source)
export function validateCustomerData(data: any): ValidationResult {
  // Shared validation logic
}

export function validateTransactionData(data: any): ValidationResult {
  // Shared validation logic
}

// Transformation functions (pure, no data source)
export function transformRawCustomer(raw: any): Customer {
  // Shared transformation logic
}

export function transformRawTransaction(raw: any): Transaction {
  // Shared transformation logic
}

// Calculation functions (pure, no data source)
export function calculateCustomerBalance(customer: Customer, transactions: Transaction[]): number {
  // Shared calculation logic
}

export function calculateDashboardMetrics(transactions: Transaction[], customers: Customer[]): DashboardMetrics {
  // Shared calculation logic
}
```

## Implementation Plan

### Phase 1: Data Abstraction Layer (CRITICAL)

#### 1.1 Create Data Adapter Interface
- **File**: `src/services/dataAdapter.ts`
- **Tasks**:
  - Define `DataAdapter` interface
  - Implement `LocalStorageAdapter`
  - Implement `SupabaseAdapter`
  - Add adapter factory based on trial mode

#### 1.2 Refactor Trial Mock Store
- **File**: `src/services/trialMockStore.ts`
- **Tasks**:
  - Keep trial mode detection
  - Keep seed data
  - Refactor to implement `DataAdapter` interface
  - Ensure thread-safe operations

### Phase 2: Shared Business Logic Layer (CRITICAL)

#### 2.1 Extract Validation Functions
- **File**: `src/services/businessLogic/validation.ts`
- **Tasks**:
  - Extract customer validation from both modes
  - Extract transaction validation from both modes
  - Extract bank account validation from both modes
  - Extract branch validation from both modes
  - Extract transaction type validation from both modes

#### 2.2 Extract Transformation Functions
- **File**: `src/services/businessLogic/transformation.ts`
- **Tasks**:
  - Extract customer data transformation
  - Extract transaction data transformation
  - Extract bank account data transformation
  - Extract branch data transformation

#### 2.3 Extract Calculation Functions
- **File**: `src/services/businessLogic/calculations.ts`
- **Tasks**:
  - Extract customer balance calculation
  - Extract dashboard metrics calculation
  - Extract cash flow aggregation
  - Extract transaction type breakdown

### Phase 3: Refactor Services (HIGH PRIORITY)

#### 3.1 Refactor Customer Service
- **File**: `src/services/database.ts` - `customerService`
- **Tasks**:
  - Use shared validation functions
  - Use shared transformation functions
  - Use data adapter for CRUD operations
  - Remove duplicate logic

#### 3.2 Refactor Transaction Service
- **File**: `src/services/database.ts` - `transactionService`
- **Tasks**:
  - Use shared validation functions
  - Use shared transformation functions
  - Use data adapter for CRUD operations
  - Remove duplicate logic

#### 3.3 Refactor Bank Account Service
- **File**: `src/services/database.ts` - `bankAccountService`
- **Tasks**:
  - Use shared validation functions
  - Use shared transformation functions
  - Use data adapter for CRUD operations
  - Remove duplicate logic

#### 3.4 Refactor Branch Service
- **File**: `src/services/database.ts` - `branchService`
- **Tasks**:
  - Use shared validation functions
  - Use shared transformation functions
  - Use data adapter for CRUD operations
  - Remove duplicate logic

#### 3.5 Refactor Transaction Type Service
- **File**: `src/services/database.ts` - `transactionTypeService`
- **Tasks**:
  - Use shared validation functions
  - Use shared transformation functions
  - Use data adapter for CRUD operations
  - Remove duplicate logic

#### 3.6 Refactor Dashboard Service
- **File**: `src/services/database.ts` - `dashboardService`
- **Tasks**:
  - Use shared calculation functions
  - Use data adapter for data fetching
  - Remove duplicate logic

### Phase 4: Testing (CRITICAL)

#### 4.1 Unit Tests
- **Tasks**:
  - Test validation functions independently
  - Test transformation functions independently
  - Test calculation functions independently
  - Test data adapter implementations

#### 4.2 Integration Tests
- **Tasks**:
  - Test trial mode with refactored services
  - Test real mode with refactored services
  - Verify identical behavior for same inputs
  - Test edge cases

#### 4.3 Regression Tests
- **Tasks**:
  - Run existing QA test suite
  - Verify all features still work
  - Check for performance degradation
  - Verify no new bugs introduced

### Phase 5: Documentation (HIGH PRIORITY)

#### 5.1 Update Documentation
- **Files**:
  - `docs/ARCHITECTURE.md`
  - `docs/CODING_STANDARDS.md`
- **Tasks**:
  - Document new layer architecture
  - Update coding standards for business logic
  - Add examples of using shared functions
  - Document data adapter pattern

## Success Criteria

### Functional Requirements
- ✅ Trial mode and real mode use identical validation logic
- ✅ Trial mode and real mode use identical transformation logic
- ✅ Trial mode and real mode use identical calculation logic
- ✅ All existing features work in both modes
- ✅ No performance degradation

### Code Quality Requirements
- ✅ Zero TypeScript errors
- ✅ No code duplication between modes
- ✅ Business logic functions are pure (no side effects)
- ✅ Data adapters are properly typed
- ✅ Clear separation of concerns

### Testing Requirements
- ✅ All existing tests pass
- ✅ New unit tests for business logic
- ✅ Integration tests for data adapters
- ✅ Regression tests for all services

## Risk Mitigation

### Risk 1: Breaking Changes
- **Mitigation**: Incremental refactoring, one service at a time
- **Backup**: Keep old implementation commented out until verified

### Risk 2: Performance Degradation
- **Mitigation**: Benchmark before and after
- **Monitoring**: Add performance metrics

### Risk 3: Data Loss
- **Mitigation**: Test with backup data first
- **Validation**: Verify data integrity after refactoring

### Risk 4: Complexity Increase
- **Mitigation**: Keep business logic simple and pure
- **Documentation**: Comprehensive inline comments

## Estimated Timeline

- **Phase 1**: 2-3 hours
- **Phase 2**: 3-4 hours
- **Phase 3**: 4-5 hours
- **Phase 4**: 2-3 hours
- **Phase 5**: 1-2 hours

**Total**: 12-17 hours

## Dependencies

### Required Tools
- TypeScript
- Vitest (for testing)
- Existing Supabase setup
- Existing localStorage implementation

### Required Knowledge
- Current codebase structure
- TypeScript type system
- Pure function principles
- Adapter pattern
- Repository pattern

## Next Steps

1. **Review this plan** with user approval
2. **Start Phase 1**: Data Abstraction Layer
3. **Test adapter implementations** before proceeding
4. **Proceed incrementally** through phases
5. **Commit after each phase** for easy rollback
6. **Final testing** before deployment
