# @superapp/shared-utils

Shared utilities package for all Superapp frontend applications, including the Supabase client, the InsForge-compatible `apiClient`, and the `createApiClient` factory.

## Installation

```bash
npm install @superapp/shared-utils
```

## Modules

### Error Handling

Standardized error handling with error codes, retry logic, and batch operations.

```typescript
import { createError, getUserMessage, retryWithBackoff, ERROR_CODES } from '@superapp/shared-utils';

// Create standardized errors
const error = createError(
  ERROR_CODES.DB_CONNECTION_ERROR,
  'Database connection failed',
  { database: 'postgres' },
  'Could not connect to database. Please check your connection.'
);

// Get user-friendly message
const userMsg = getUserMessage(ERROR_CODES.DB_CONNECTION_ERROR);

// Retry with exponential backoff
const result = await retryWithBackoff(
  () => fetchData(),
  { maxRetries: 3, baseDelay: 1000 }
);

// Check if error is an AppError
if (error.code === ERROR_CODES.DB_CONNECTION_ERROR) {
  // Handle specific error
}
```

**Available Error Codes:**
- `DB_CONNECTION_ERROR` - Database connection issues
- `QUERY_ERROR` - Database query failures
- `AUTHENTICATION_ERROR` - Authentication failures
- `AUTHORIZATION_ERROR` - Permission issues
- `VALIDATION_ERROR` - Data validation failures
- `NETWORK_ERROR` - Network connectivity issues
- `FILE_PARSE_ERROR` - File parsing failures
- `UNKNOWN_ERROR` - Generic errors

### Data Cleaning

Data cleaning rules and validation utilities.

```typescript
import {
  trimWhitespaceRule,
  normalizeDatesRule,
  validateQuantitiesRule,
  removeDuplicatesRule,
  applyRules,
  type CleaningRule,
  type CleaningResult
} from '@superapp/shared-utils';

// Apply built-in cleaning rules
const result = applyRules(data, [
  trimWhitespaceRule,
  normalizeDatesRule,
  validateQuantitiesRule,
]);

// Access cleaned data and results
const { data: cleanedData, result: cleaningResult } = result;
console.log(`Original: ${cleaningResult.originalCount}`);
console.log(`Cleaned: ${cleaningResult.cleanedCount}`);
console.log(`Modified: ${cleaningResult.modified}`);
console.log(`Errors:`, cleaningResult.errors);

// Create custom cleaning rule
const customRule: CleaningRule = {
  name: 'custom_rule',
  description: 'Custom cleaning logic',
  apply: (data) => {
    // Your custom logic
    return transformedData;
  }
};

// Apply custom rules
const customResult = applyRules(data, [customRule]);
```

**Available Cleaning Rules:**
- `trimWhitespaceRule` - Trim leading/trailing whitespace
- `normalizeDatesRule` - Normalize date formats
- `validateQuantitiesRule` - Validate and fix numeric quantities
- `removeDuplicatesRule` - Remove duplicate records
- `removeInvalidEntriesRule` - Remove invalid/incomplete entries

### Import/Export

File parsing and export utilities for Excel, CSV, and JSON formats.

```typescript
import {
  parseFile,
  exportToExcel,
  exportToCSV,
  exportToJSON,
  generateTemplate
} from '@superapp/shared-utils';

// Parse Excel/CSV files
const parsed = await parseFile(file, { type: 'excel' });
console.log(parsed.data); // Array of parsed objects

// Export to Excel
const excelResult = exportToExcel(data, { fileName: 'export.xlsx' });
if (excelResult.success) {
  console.log(`Exported to ${excelResult.filename}`);
}

// Export to CSV
const csvResult = exportToCSV(data, { fileName: 'export.csv' });
if (csvResult.success) {
  console.log(`Exported to ${csvResult.filename}`);
}

// Export to JSON
const jsonResult = exportToJSON(data, { fileName: 'export.json' });
if (jsonResult.success) {
  console.log(`Exported to ${jsonResult.filename}`);
}

// Generate template file
const columns = [
  { name: 'Name', required: true },
  { name: 'Email', required: true },
  { name: 'Phone', required: false }
];
const templateResult = generateTemplate(columns, { fileName: 'template.xlsx' });
if (templateResult.success) {
  console.log(`Template generated: ${templateResult.filename}`);
}
```

### Backup/Restore

Backup and restore functionality with conflict detection.

```typescript
import {
  createBackup,
  restoreBackup,
  detectConflicts,
  resolveConflicts,
  type ConflictInfo
} from '@superapp/shared-utils';

// Create backup with metadata
const backupResult = createBackup(data, {
  includeMetadata: true,
  format: 'json',
  metadata: { source: 'manual', reason: 'pre-migration' }
});

if (backupResult.success) {
  console.log('Backup created successfully');
  console.log('Backup:', backupResult.backup);
}

// Detect conflicts between backup and existing data
const conflicts = detectConflicts(
  backupData,
  existingData,
  { idField: 'id', timestampField: 'updated_at' }
);

console.log(`Found ${conflicts.conflicts.length} conflicts`);
console.log('Summary:', conflicts.summary);

// Resolve conflicts
const resolution = resolveConflicts(
  conflicts.conflicts,
  'keep-current' // or 'keep-backup', 'merge'
);

console.log(`Resolved ${resolution.resolved} conflicts`);
console.log(`Unresolved: ${resolution.unresolved}`);

// Restore from backup
const restoreResult = await restoreBackup(
  backup,
  { conflictResolution: 'skip', validateBeforeRestore: true }
);

if (restoreResult.success) {
  console.log('Restore successful');
  console.log('Data:', restoreResult.data);
}
```

**Conflict Types:**
- `create` - Item exists in backup but not in current data
- `update` - Item exists in both but has different values
- `delete` - Item exists in current data but not in backup
- `modified` - Item modified in both with different timestamps

## Migration Guide

### Migrating from Local Utilities to Shared Utils

#### Error Handling Migration

**Before:**
```typescript
// Local error handling
const error = {
  code: 'DB_ERROR',
  message: 'Database failed',
  timestamp: new Date()
};
```

**After:**
```typescript
// Using shared utilities
import { createError, ERROR_CODES } from '@superapp/shared-utils';

const error = createError(
  ERROR_CODES.DB_CONNECTION_ERROR,
  'Database failed'
);
```

#### Data Cleaning Migration

**Before:**
```typescript
// Local cleaning logic
function cleanData(data) {
  return data.map(item => ({
    ...item,
    name: item.name.trim(),
    date: normalizeDate(item.date)
  }));
}
```

**After:**
```typescript
// Using shared utilities
import { trimWhitespaceRule, normalizeDatesRule, applyRules } from '@superapp/shared-utils';

const { data: cleanedData } = applyRules(data, [
  trimWhitespaceRule,
  normalizeDatesRule
]);
```

#### Import/Export Migration

**Before:**
```typescript
// Local export logic
function exportToCSV(data, filename) {
  const csv = convertToCSV(data);
  downloadFile(csv, filename);
}
```

**After:**
```typescript
// Using shared utilities
import { exportToCSV } from '@superapp/shared-utils';

const result = exportToCSV(data, { fileName: filename });
if (result.success) {
  console.log(`Exported to ${result.filename}`);
}
```

## API Client (`createApiClient`)

Use `createApiClient(supabase)` to get a drop-in replacement for `supabase.from()` / `supabase.rpc()` that routes data through an optional local InsForge API while keeping Supabase Auth untouched.

```typescript
import { createApiClient } from "@superapp/shared-utils";
import { supabase } from "./supabase-client";

export const { apiClient, initializeApiClient } = createApiClient(supabase);
```

- On production (`*.appforyou.xyz`) `apiClient` is always the Supabase client.
- On local dev it health-checks `http://localhost:3001/health`; if the InsForge API is up, `apiClient` switches to the local gateway for `.from()` / `.rpc()` calls, otherwise it stays on Supabase.
- `initializeApiClient()` is called automatically when the module loads.

See [docs/DATA-ROUTING.md](../../docs/DATA-ROUTING.md) for the full workflow.

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Test
npm test

# Test in watch mode
npm run test:watch

# Lint
npm run lint

# Lint with auto-fix
npm run lint:fix
```

## License

MIT
