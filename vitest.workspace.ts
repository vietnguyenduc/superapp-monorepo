import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'apps/sales-operation',
  'apps/inventory-operation',
  'apps/accounting',
  'apps/cashflow',
  'apps/operations-portal',
  'apps/hr-operation',
  'apps/admin-portal',
  'packages/shared-utils',
  'packages/ui',
  'packages/hooks',
  'packages/iam',
  'packages/types',
]);
