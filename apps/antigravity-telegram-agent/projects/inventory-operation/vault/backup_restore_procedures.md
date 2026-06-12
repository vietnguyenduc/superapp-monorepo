# Backup and Restore Procedures - Inventory Operation System

> **Adapted from cashflow app (`apps/cashflow/memory/backup_restore_procedures.md`)**

**Project:** Inventory Operation System (shared Supabase project: `peslmsctejmvkwzyohke`)  
**Last Updated:** 2026-05-03

---

## Overview

This document provides step-by-step backup and restore procedures for the Inventory Operation System database hosted on Supabase. Since both cashflow and inventory apps share the same Supabase project, backups cover **all shared and inventory-specific tables**.

## 1. Backup Database

### 1.1 Backup via Supabase Dashboard (Recommended)

**Step 1: Access Supabase Dashboard**
1. Log in to https://supabase.com/dashboard
2. Select project: `peslmsctejmvkwzyohke`
3. Navigate to: Database ? Backups

**Step 2: Create Manual Backup**
1. Click "Create backup" or "New backup"
2. Name the backup (e.g., `backup-2026-05-03-pre-deployment`)
3. Choose backup time (now or schedule)
4. Click "Confirm" to create

**Step 3: Verify Backup**
1. Backup appears in list with status "Completed"
2. Backup duration depends on database size
3. Download backup file if needed

### 1.2 Backup via Supabase CLI

**Install Supabase CLI:**
```bash
npm install -g supabase
# Or
brew install supabase/tap/supabase
```

**Login:**
```bash
supabase login
```

**Backup Commands:**
```bash
# Full database backup
supabase db dump --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.peslmsctejmvkwzyohke.supabase.co:5432/postgres" -f backup-$(date +%Y-%m-%d).sql

# Data only (no schema)
supabase db dump --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.peslmsctejmvkwzyohke.supabase.co:5432/postgres" --data-only -f backup-data-$(date +%Y-%m-%d).sql

# Schema only (no data)
supabase db dump --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.peslmsctejmvkwzyohke.supabase.co:5432/postgres" --schema-only -f backup-schema-$(date +%Y-%m-%d).sql
```

### 1.3 Backup via psql

**Full database:**
```bash
pg_dump -h db.peslmsctejmvkwzyohke.supabase.co -U postgres -d postgres -F c -f backup-$(date +%Y-%m-%d).dump
```

**Data only:**
```bash
pg_dump -h db.peslmsctejmvkwzyohke.supabase.co -U postgres -d postgres --data-only -f backup-data-$(date +%Y-%m-%d).sql
```

---

## 2. Automated Backup Schedule

### 2.1 Dashboard Configuration

1. Supabase Dashboard ? Project Settings ? Database
2. Find "Automated backups" section
3. Enable "Automated backups"
4. Frequency: **Daily**
5. Time: **2:00 AM - 4:00 AM local time**
6. Retention: **7-30 days**
7. Click "Save"

### 2.2 Cron Job (Self-Hosted)

**Create backup script:**
```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/path/to/backups"
DB_URL="postgresql://postgres:[YOUR-PASSWORD]@db.peslmsctejmvkwzyohke.supabase.co:5432/postgres"

pg_dump -h db.peslmsctejmvkwzyohke.supabase.co -U postgres -d postgres -F c -f $BACKUP_DIR/backup-$DATE.dump

# Delete backups older than 30 days
find $BACKUP_DIR -name "backup-*.dump" -mtime +30 -delete

echo "Backup completed: backup-$DATE.dump"
```

**Configure cron:**
```bash
crontab -e

# Add line (daily at 2:00 AM)
0 2 * * * /path/to/backup-database.sh >> /var/log/backup.log 2>&1
```

---

## 3. Restore Database

### 3.1 Restore via Supabase Dashboard (Recommended)

1. Supabase Dashboard ? Database ? Backups
2. Select backup to restore
3. Click "Restore"
4. Confirm (will overwrite current data)
5. Wait for completion

**Post-restore verification:**
1. Check data integrity
2. Test main functions
3. Verify RLS policies

### 3.2 Restore via Supabase CLI

```bash
# From SQL file
supabase db reset --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.peslmsctejmvkwzyohke.supabase.co:5432/postgres" -f backup-2026-05-03.sql

# From dump file
pg_restore -h db.peslmsctejmvkwzyohke.supabase.co -U postgres -d postgres -v backup-2026-05-03.dump
```

### 3.3 Restore via psql

```bash
psql -h db.peslmsctejmvkwzyohke.supabase.co -U postgres -d postgres -f backup-2026-05-03.sql
```

---

## 4. Backup / Restore Specific Tables

### Inventory-Specific Tables

| Table | Purpose | Backup Priority |
|-------|---------|---------------|
| `products` | Product catalog | High |
| `inventory_records` | Stock tracking | High |
| `sales_records` | Sales transactions | High |
| `special_outbound_records` | Non-sales movements | Medium |
| `inventory_variance_reports` | Stock check variances | Medium |

### Shared Tables (with Cashflow App)

| Table | Purpose | Backup Priority |
|-------|---------|---------------|
| `users` | User accounts with RBAC | Critical |
| `companies` | Multi-tenancy | Critical |
| `branches` | Branch/location data | Critical |
| `customers` | Customer data | Cashflow-specific |
| `transactions` | Financial transactions | Cashflow-specific |

### Commands

**Backup single inventory table:**
```bash
pg_dump -h db.peslmsctejmvkwzyohke.supabase.co -U postgres -d postgres -t products -f backup-products.sql
```

**Backup all inventory tables:**
```bash
pg_dump -h db.peslmsctejmvkwzyohke.supabase.co -U postgres -d postgres \
  -t products \
  -t inventory_records \
  -t sales_records \
  -t special_outbound_records \
  -t inventory_variance_reports \
  -f backup-inventory-tables.sql
```

**Restore single table:**
```bash
psql -h db.peslmsctejmvkwzyohke.supabase.co -U postgres -d postgres -f backup-products.sql
```

**Warning:** Restoring specific tables may cause foreign key constraint violations. Restore full database or drop constraints first.

---

## 5. Best Practices

### Before Backup

- [ ] Check database health
- [ ] Ensure no critical active transactions
- [ ] Notify users of scheduled maintenance
- [ ] Test backup process in staging environment

### During Backup

- [ ] Monitor backup progress
- [ ] Check error logs
- [ ] Verify backup file size is reasonable
- [ ] Save backup file to multiple locations (cloud + local)

### After Backup

- [ ] Verify backup integrity
- [ ] Test restore process (in staging)
- [ ] Save backup metadata (date, size, description)
- [ ] Update backup log

### Before Restore

- [ ] Backup current database (before restore)
- [ ] Notify users of downtime
- [ ] Save current schema version
- [ ] Check compatibility between backup and current schema

### During Restore

- [ ] Monitor restore progress
- [ ] Check error logs
- [ ] Verify data integrity after restore
- [ ] Test RLS policies

### After Restore

- [ ] Test all main functions
- [ ] Verify data consistency
- [ ] Check foreign key constraints
- [ ] Notify users of system availability

---

## 6. Troubleshooting

### Backup Failed

**Common errors:**
- Connection timeout
- Insufficient permissions
- Disk space full

**Solutions:**
- Check network connection
- Verify database credentials
- Check server disk space
- Try smaller backup (specific table)

### Restore Failed

**Common errors:**
- Schema mismatch
- Foreign key constraint violations
- Permission denied

**Solutions:**
- Check schema version
- Drop and recreate constraints
- Verify user permissions
- Use `--clean` flag with pg_dump

### Data Corruption After Restore

**Common errors:**
- Encoding issues
- Character set mismatch
- Data type incompatibility

**Solutions:**
- Check encoding (UTF-8)
- Verify character set settings
- Check data types compatibility
- Use transaction mode restore

---

## 7. Monitoring & Alerts

### Dashboard Alerts

1. Project Settings ? Alerts
2. Enable "Database backup failed"
3. Enable "Database restore failed"
4. Configure email or Slack notifications

### Key Metrics

- Backup success rate
- Backup duration
- Backup file size
- Restore success rate
- Restore duration

### Log Locations

- Supabase Dashboard ? Database ? Logs
- Local backup script logs
- Cron job logs (`/var/log/backup.log`)

---

## 8. Security Considerations

### Protect Backup Files

- Encrypt backup files (if stored locally)
- Use secure storage (AWS S3, Google Cloud Storage)
- Limit access to backup files
- Regularly audit backup access logs

### Backup Credentials

- **NEVER** hardcode passwords in scripts
- Use environment variables
- Use secret management tools
- Rotate credentials regularly

### Backup Retention

- Delete old backups per policy
- Keep important backups longer
- Archive long-term backups
- Compress old backups to save space

---

## 9. Emergency Procedures

### Database Corruption

**Step 1: Stop Access**
- Stop application
- Halt database writes

**Step 2: Assess Damage**
- Check logs
- Identify corrupted data

**Step 3: Restore**
- Restore from most recent backup
- Verify data integrity

**Step 4: Resume**
- Start application
- Monitor health

### Accidental Data Deletion

**Step 1: Stop Writes**
- Stop application
- Halt database writes

**Step 2: Restore**
- Restore from backup before deletion
- Or use Point-in-Time Recovery (PITR)

**Step 3: Verify**
- Check deleted data is restored
- Test functionality

### Ransomware Attack

**Step 1: Isolate**
- Stop network access
- Disconnect database

**Step 2: Assess**
- Check extent of damage
- Identify affected data

**Step 3: Restore**
- Restore from clean backup
- Scan backup for malware

**Step 4: Secure**
- Update credentials
- Patch vulnerabilities
- Monitor for suspicious activity

---

## 10. Daily Backup Checklist

- [ ] Backup completed successfully
- [ ] Backup file size is reasonable
- [ ] Backup integrity verified
- [ ] Backup saved to multiple locations
- [ ] Backup log updated
- [ ] Alerts configured and working
- [ ] Restore test completed (weekly)

---

## References

- **Supabase Documentation:** https://supabase.com/docs/guides/database/backups
- **Project ID:** `peslmsctejmvkwzyohke`
- **Support Email:** support@supabase.com
- **Shared with:** Cashflow Management System