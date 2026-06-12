# Task: Fix accounting app tests — 7 files, 26 failures

## Progress
- [ ] 1. Fix `rbac.test.ts` — 4 failures (role names: admin→admin_master, branch_manager→admin_company)
- [ ] 2. Fix `errorHandling.test.tsx` — 1 failure (ERROR_CODES.DATABASE_CONNECTION_FAILED)
- [ ] 3. Fix `formatting.test.ts` — 2 failures (formatTransactionType values)
- [ ] 4. Fix `importUtils.test.ts` — 19 failures (customer_name→customer_code)
- [ ] 5. Fix `transactionTypeNames.test.tsx` — Suite error (missing context)
- [ ] 6. Fix `dashboardMetrics.test.ts` — Suite error (missing method)
- [ ] 7. Fix `backupRecovery.test.ts` — Suite error (import/export mismatch)
- [ ] 8. Verify: run `npx vitest run` — 0 failures
