# Deployment Checklist & Rollback Plan — Inventory Operation System

> **Phase 9: Deployment (Week 9)**
> **Last Updated:** 2026-05-04

---

## 9.1 Pre-Deployment

### Tests & Validation

| Check | Status | Verified By | Date |
|-------|--------|-------------|------|
| Unit tests pass (Vitest) | ? | | |
| Integration tests pass (DB operations) | ? | | |
| E2E tests pass (Cypress/Playwright) | ? | | |
| Security tests pass (XSS, SQL injection, CSRF) | ? | | |
| Performance benchmarks met (LCP <2.5s, CLS <0.1) | ? | | |
| No ESLint / TypeScript errors | ? | | |
| No `console.log` in production build | ? | | |

### Code Review

| Check | Status | Reviewer | Date |
|-------|--------|----------|------|
| All PRs merged to `main` | ? | | |
| Code reviewed by 2nd developer | ? | | |
| No hardcoded secrets / API keys | ? | | |
| RLS policies reviewed (no `USING (true)`) | ? | | |
| Database migrations reviewed | ? | | |

### Documentation

| Check | Status | Date |
|-------|--------|------|
| AI_CONTEXT.md updated | ? | |
| ADRs updated (if new decisions) | ? | |
| User manuals reflect latest UI | ? | |
| API docs updated (if changed) | ? | |
| CHANGELOG.md prepared | ? | |

---

## 9.2 Database Migration

### Pre-Migration Backup

```bash
# Supabase CLI
supabase db dump --db-url "postgresql://postgres:[PASS]@db.peslmsctejmvkwzyohke.supabase.co:5432/postgres" -f pre-deploy-backup-$(date +%Y%m%d-%H%M).sql
```

| Check | Status | Date |
|-------|--------|------|
| Full database backup created | ? | |
| Backup file verified (size >0, readable) | ? | |
| Backup stored in 2 locations | ? | |

### Apply Migrations

**Order of execution:**
1. Schema migrations (`supabase/migrations/`)
2. RLS policy updates (`supabase/migrations/013_inventory_rls_policies.sql`)
3. Seed data (if new tables)
4. Verify with test queries

```sql
-- Post-migration verification
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM inventory_records;
SELECT COUNT(*) FROM sales_records;
-- Verify RLS is active: 
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
```

| Migration | Applied | Verified | Date |
|-----------|---------|----------|------|
| 011_inventory_app_permissions.sql | ? | ? | |
| 012_inventory_multitenancy.sql | ? | ? | |
| 013_inventory_rls_policies.sql | ? | ? | |
| 014_inventory_seed_data.sql | ? | ? | |

---

## 9.3 Application Deployment

### Build

```bash
cd apps/inventory-operation
npm ci
npm run lint
npm run build
```

| Check | Status | Date |
|-------|--------|------|
| Build succeeds with 0 errors | ? | |
| Bundle size <200KB (initial) | ? | |
| `vercel.json` security headers included | ? | |

### Environment Variables

```bash
# apps/inventory-operation/.env.production
VITE_SUPABASE_URL=https://peslmsctejmvkwzyohke.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjY2MTIsImV4cCI6MjA4NjA0MjYxMn0.Ulua_wXmMGoWRvJ22DDWC8U_JE6g0L-EuAEhbBNhB-w
```

| Variable | Set in Vercel | Verified | Date |
|----------|--------------|----------|------|
| `VITE_SUPABASE_URL` | ? | ? | |
| `VITE_SUPABASE_ANON_KEY` | ? | ? | |
| `VITE_APP_ENV=production` | ? | ? | |

### Deploy to Vercel

```bash
# Option 1: Vercel CLI
vercel --prod

# Option 2: Git push (if auto-deploy enabled)
git push origin main
```

| Step | Status | Date |
|------|--------|------|
| Preview deployment tested | ? | |
| Production deployment triggered | ? | |
| Build logs reviewed (no errors) | ? | |
| Deployment URL accessible | ? | |

---

## 9.4 Post-Deployment Verification

### Smoke Tests

| Test | Expected | Actual | Pass |
|------|----------|--------|------|
| Homepage loads | 200 OK | | ? |
| Login page loads | 200 OK | | ? |
| Supabase connection | No errors in console | | ? |
| Auth callback works | Redirect to dashboard | | ? |
| RLS policies active | Data filtered by user | | ? |

### Feature Verification

| Feature | Role | Test | Pass |
|---------|------|------|------|
| Product catalog view | staff | See products for branch | ? |
| Inventory entry | staff | Add stock-in/out | ? |
| Sales entry | staff | Record daily sales | ? |
| Product CRUD | admin_company | Create/edit/delete | ? |
| Branch management | admin_company | Add/edit branches | ? |
| Company settings | admin_company | Update company info | ? |
| Staff management | admin_company | Invite/deactivate | ? |
| Multi-company view | admin_master | See all companies | ? |
| Bulk import (200 rows) | admin_company | CSV upload works | ? |
| Export reports | any | CSV download works | ? |

### Monitoring

| Check | Tool | Status | Date |
|-------|------|--------|------|
| Error logs (Vercel) | Vercel Dashboard | ? | |
| Database logs | Supabase Logs | ? | |
| Performance metrics | web-vitals | ? | |
| RLS policy violations | Supabase Logs | ? | |

---

## Rollback Plan

### Trigger Conditions

Rollback if ANY of:
- [ ] Smoke tests fail (>2 critical failures)
- [ ] Database corruption detected
- [ ] Auth system broken (users cannot login)
- [ ] RLS policies leaking data
- [ ] Performance degraded >50% vs baseline

### Rollback Steps

**1. Stop Deployment**
```bash
vercel --prod # if using CLI, cancel
# Or disable auto-deploy in Vercel Dashboard
```

**2. Revert Code**
```bash
git log --oneline -5  # identify last good commit
git revert HEAD  # or
git checkout <last-good-commit>
git push origin main --force-with-lease
```

**3. Restore Database**
```bash
# From pre-deployment backup
psql -h db.peslmsctejmvkwzyohke.supabase.co -U postgres -d postgres -f pre-deploy-backup-YYYYMMDD-HHMM.sql
```

**4. Verify Rollback**
- [ ] Smoke tests pass on previous version
- [ ] Database data consistent
- [ ] No data loss (compare row counts)

**5. Post-Rollback**
- [ ] Document root cause
- [ ] Update incident log
- [ ] Schedule fix deployment

---

## Emergency Contacts

| Role | Name | Contact | Escalation |
|------|------|---------|------------|
| Tech Lead | | | |
| DevOps | | | |
| Database Admin | | | |
| Product Owner | | | |

---

## Deployment Log

| Version | Date | Deployed By | Changes | Issues |
|---------|------|-------------|---------|--------|
| 1.0 | | | Initial MVP | |
| 2.0 | | | Cashflow standards upgrade | |