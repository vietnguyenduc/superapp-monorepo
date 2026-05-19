# Shared Utils Migration Guide

This guide provides detailed instructions for migrating existing utility functions to use the `@superapp/shared-utils` package.

## Table of Contents

- [Overview](#overview)
- [Pre-Migration Checklist](#pre-migration-checklist)
- [Migration Steps](#migration-steps)
- [Module-Specific Migrations](#module-specific-migrations)
  - [Error Handling](#error-handling)
  - [Data Cleaning](#data-cleaning)
  - [Import/Export](#importexport)
  - [Backup/Restore](#backuprestore)
- [Common Issues and Solutions](#common-issues-and-solutions)
- [Testing Your Migration](#testing-your-migration)
- [Rollback Plan](#rollback-plan)

## Overview

The `@superapp/shared-utils` package provides standardized utility functions for error handling, data cleaning, import/export operations, and backup/restore functionality. This guide helps you migrate your existing local utilities to use the shared package.

## Pre-Migration Checklist

Before starting the migration, ensure:

- [ ] You have read the shared-utils README to understand available functions
- [ ] You have backed up your current utility files
- [ ] You have identified all files that use local utilities
- [ ] You have run tests to establish a baseline
- [ ] You have updated your app's package.json to include `@superapp/shared-utils` dependency
- [ ] You have configured TypeScript paths if needed (see Common Issues)

## Migration Steps

### Step 1: Add Dependency

Add the shared-utils package to your app's `package.json`:

```json
{
  "dependencies": {
    "@superapp/shared-utils": "*"
  }
}
```

### Step 2: Configure TypeScript Paths (if needed)

If TypeScript cannot resolve the package, add paths to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@superapp/shared-utils": ["../../packages/shared-utils/src"]
    }
  }
}
```

### Step 3: Install Dependencies

Run `npm install` from the monorepo root to install the workspace dependency.

### Step 4: Migrate Utility Files

For each utility file you want to migrate:

1. Identify the functions to replace
2. Import the shared utility functions
3. Replace local implementations with shared functions
4. Update type references if needed
5. Test the changes

## Module-Specific Migrations

### Error Handling

#### Before Migration

```typescript
// Local error handling
export const ERROR_CODES = {
  DB_ERROR: 'DB_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export function createError(code: string, message: string) {
  return {
    code,
    message,
    timestamp: new Date(),
  };
}

export function getUserMessage(code: string): string {
  const messages: Record<string, string> = {
    DB_ERROR: 'Database error occurred',
    VALIDATION_ERROR: 'Invalid data provided',
    NETWORK_ERROR: 'Network connection failed',
  };
  return messages[code] || 'An error occurred';
}
```

#### After Migration

```typescript
// Using shared utilities
import {
  ERROR_CODES as SharedErrorCodes,
  createError as sharedCreateError,
  getUserMessage as sharedGetUserMessage,
} from '@superapp/shared-utils';

// Re-export shared codes
export { ERROR_CODES as SharedErrorCodes };

// App-specific error codes (extend shared codes)
export const ERROR_CODES = {
  ...SharedErrorCodes,
  // Add app-specific codes if needed
  APP_SPECIFIC_ERROR: 'APP_SPECIFIC_ERROR',
} as const;

// Wrapper function for backward compatibility
export function createError(
  code: string,
  message: string,
  details?: any,
  userMessage?: string
): AppError {
  const sharedError = sharedCreateError(
    code as any,
    message,
    details,
    userMessage
  );
  return {
    name: 'AppError',
    ...sharedError,
    timestamp: new Date(sharedError.timestamp),
  };
}

// Wrapper function for backward compatibility
export function getUserMessage(code: string): string {
  return sharedGetUserMessage(code as any);
}
```

#### Key Changes

1. Import shared error codes and functions
2. Extend shared error codes with app-specific codes if needed
3. Wrap shared functions to maintain backward compatibility
4. Update type references from local types to shared types

### Data Cleaning

#### Before Migration

```typescript
// Local data cleaning
export interface CleaningRule {
  name: string;
  apply: (data: any) => any;
}

export interface CleaningResult {
  original: any;
  cleaned: any;
  removed: number;
  modified: number;
}

const trimWhitespaceRule: CleaningRule = {
  name: 'trim_whitespace',
  apply: (data) => {
    if (typeof data === 'string') return data.trim();
    if (Array.isArray(data)) return data.map(item => trimWhitespace(item));
    return data;
  },
};

export function cleanProducts(products: Product[]) {
  let modified = 0;
  const cleaned = products.map(p => {
    const original = JSON.stringify(p);
    const cleaned = {
      ...p,
      name: p.name?.trim(),
      category: p.category?.trim(),
    };
    if (JSON.stringify(cleaned) !== original) modified++;
    return cleaned;
  });
  
  return {
    original: products,
    cleaned,
    modified,
  };
}
```

#### After Migration

```typescript
// Using shared utilities
import {
  CleaningRule as SharedCleaningRule,
  CleaningResult as SharedCleaningResult,
  trimWhitespaceRule,
  normalizeDatesRule,
  applyRules,
} from '@superapp/shared-utils';

// Re-export shared types for backward compatibility
export type CleaningRule = SharedCleaningRule;
export type CleaningResult = SharedCleaningResult;

// App-specific cleaning rules
const categoryNormalizationRule: CleaningRule = {
  name: 'category_normalization',
  description: 'Normalize product categories',
  apply: (data) => {
    if (Array.isArray(data)) {
      return data.map(item => {
        if (item.category) {
          return {
            ...item,
            category: item.category.trim().toLowerCase(),
          };
        }
        return item;
      });
    }
    return data;
  },
};

export function cleanProducts(products: Product[]) {
  const rules = [
    trimWhitespaceRule,
    categoryNormalizationRule,
  ];
  
  const { data: cleanedData, result } = applyRules(products, rules);
  
  return {
    original: products,
    cleaned: cleanedData,
    modified: result.modified,
  };
}
```

#### Key Changes

1. Import shared cleaning rules and types
2. Re-export shared types for backward compatibility
3. Keep app-specific cleaning rules locally
4. Use `applyRules` function to apply cleaning rules
5. Update function signatures to match shared utilities

### Import/Export

#### Before Migration

```typescript
// Local import/export
export function exportToCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => row[h]).join(',')),
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      resolve(json);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
```

#### After Migration

```typescript
// Using shared utilities
import {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  parseFile,
} from '@superapp/shared-utils';

export function exportToCSVWrapper(data: any[], filename: string) {
  const result = exportToCSV(data, { fileName: filename });
  if (result.success) {
    console.log(`Exported to ${result.filename}`);
  } else {
    console.error('Export failed');
  }
  return result;
}

export async function parseExcelFile(file: File): Promise<any[]> {
  const result = await parseFile(file, { type: 'excel' });
  return result.data;
}
```

#### Key Changes

1. Import shared export/parse functions
2. Update function calls to use options object pattern
3. Handle success/error responses from shared functions
4. Remove local implementation code

### Backup/Restore

#### Before Migration

```typescript
// Local backup/restore
export function createBackup(data: any[]) {
  return {
    data,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };
}

export function detectConflicts(backup: any[], current: any[]) {
  const conflicts = [];
  // Local conflict detection logic
  return conflicts;
}
```

#### After Migration

```typescript
// Using shared utilities
import {
  createBackup as sharedCreateBackup,
  detectConflicts as sharedDetectConflicts,
  resolveConflicts,
} from '@superapp/shared-utils';

export function createBackup(data: any[], options = {}) {
  const result = sharedCreateBackup(data, {
    includeMetadata: true,
    metadata: options,
  });
  return result;
}

export function detectConflicts(backup: any[], current: any[], options = {}) {
  const result = sharedDetectConflicts(current, backup, {
    idField: 'id',
    timestampField: 'updated_at',
    ...options,
  });
  return result;
}
```

#### Key Changes

1. Import shared backup/restore functions
2. Update function signatures to match shared utilities
3. Use options object pattern for configuration
4. Handle conflict detection with proper field mappings

## Common Issues and Solutions

### Issue: Cannot find module '@superapp/shared-utils'

**Solution:** Add TypeScript paths configuration to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@superapp/shared-utils": ["../../packages/shared-utils/src"]
    }
  }
}
```

### Issue: Type errors with ERROR_CODES

**Solution:** Use `string` type instead of the ERROR_CODES enum:

```typescript
// Before
function handleError(code: ERROR_CODES) { ... }

// After
function handleError(code: string) { ... }
```

### Issue: Function signature mismatch

**Solution:** Create wrapper functions to maintain backward compatibility:

```typescript
export function localFunction(args) {
  return sharedFunction({
    // Map local args to shared function options
    fileName: args.filename,
    // ... other mappings
  });
}
```

### Issue: Missing app-specific functionality

**Solution:** Extend shared utilities with app-specific logic:

```typescript
// Keep app-specific rules locally
const appSpecificRule: CleaningRule = {
  name: 'app_specific',
  apply: (data) => {
    // App-specific logic
  },
};

// Combine with shared rules
const allRules = [...sharedRules, appSpecificRule];
```

## Testing Your Migration

### Unit Testing

Test each migrated function to ensure it behaves correctly:

```typescript
import { describe, it, expect } from 'vitest';
import { createError } from './errorHandling';

describe('Error Handling Migration', () => {
  it('should create error with shared utilities', () => {
    const error = createError('DB_ERROR', 'Test error');
    expect(error.code).toBe('DB_ERROR');
    expect(error.message).toBe('Test error');
    expect(error.timestamp).toBeDefined();
  });
});
```

### Integration Testing

Test the entire flow to ensure migrations work together:

```typescript
describe('Integration Test', () => {
  it('should clean data and export to CSV', async () => {
    const data = [{ name: '  test  ', value: 100 }];
    const { data: cleaned } = applyRules(data, [trimWhitespaceRule]);
    const result = exportToCSV(cleaned, { fileName: 'test.csv' });
    expect(result.success).toBe(true);
  });
});
```

### Regression Testing

Run existing tests to ensure no breaking changes:

```bash
npm test
```

## Rollback Plan

If issues arise after migration, follow these steps to rollback:

1. Revert utility files to their original state
2. Remove `@superapp/shared-utils` from package.json
3. Run `npm install` to restore original dependencies
4. Run tests to verify rollback was successful

### Rollback Checklist

- [ ] Restore backed-up utility files
- [ ] Remove shared-utils dependency
- [ ] Reinstall dependencies
- [ ] Run tests to verify
- [ ] Document rollback reason for future reference

## Best Practices

1. **Gradual Migration**: Migrate one module at a time to isolate issues
2. **Backward Compatibility**: Keep wrapper functions to maintain existing API
3. **Testing**: Test thoroughly after each migration step
4. **Documentation**: Document any app-specific extensions or modifications
5. **Communication**: Inform team members about the migration and changes

## Support

If you encounter issues not covered in this guide:

1. Check the shared-utils README for API documentation
2. Review existing migration examples in the codebase
3. Contact the development team for assistance

## Changelog

- **v1.0.0** - Initial migration guide
